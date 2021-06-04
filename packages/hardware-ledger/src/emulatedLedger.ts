import { err, Result } from 'neverthrow'
import { Observable, of, throwError } from 'rxjs'
import {
	BIP32PathComponent,
	BIP32PathComponentT,
	ECPointOnCurveT,
	hardenedIncrement,
	HDNodeT,
	HDPathRadix,
	HDPathRadixT,
	PublicKey,
	SignatureT,
} from '@radixdlt/crypto'
import { map, mergeMap, take, tap } from 'rxjs/operators'
import { log, readBuffer, toObservable } from '@radixdlt/util'
import { NetworkT } from '@radixdlt/primitives'
import {
	LedgerInstruction,
	LedgerResponseCodes,
	MockedLedgerNanoRecorderT,
	RadixAPDUT,
	radixCLA,
} from './_types'
import { SemVerT } from '@radixdlt/hardware-wallet'

const hdPathFromBuffer = (
	data: Buffer | undefined,
): Result<HDPathRadixT, Error> => {
	if (!data) {
		return err(new Error(`No data, or too short.`))
	}
	const readNextBuffer = readBuffer(data)

	const numberOfBIP32Components = readNextBuffer(1)
		._unsafeUnwrap()
		.readUInt8(0)

	if (numberOfBIP32Components !== 5) {
		return err(new Error('Expected BIP32 path to have 5 compinents'))
	}

	let level = 1
	const bip32PathAt = (): BIP32PathComponentT => {
		let index = readNextBuffer(4)._unsafeUnwrap().readUInt32BE()
		let isHardened = false
		if (index >= hardenedIncrement) {
			isHardened = true
			index -= hardenedIncrement
		}
		const bip32 = BIP32PathComponent.create({
			index,
			isHardened,
			level,
		})._unsafeUnwrap()

		level += 1

		return bip32
	}

	const bipPaths: BIP32PathComponentT[] = Array(numberOfBIP32Components)
		.fill(undefined)
		.map(_ => bip32PathAt())

	return HDPathRadix.fromComponents(bipPaths)
}

const emulateDoSignHash = (
	input: Readonly<{
		hdMasterNode: HDNodeT
		recorder: MockedLedgerNanoRecorderT
		apdu: RadixAPDUT
	}>,
): Observable<Buffer> => {
	const { apdu, hdMasterNode, recorder } = input
	const { data, p1 } = apdu
	const { usersInputOnLedger, promptUserForInputOnLedger } = recorder

	const sha256HashByteCount = 32
	const expectLength = 1 + 20 + 1 + sha256HashByteCount

	if (!data) {
		return throwError(() => LedgerResponseCodes.SW_WRONG_DATA_LENGTH)
	}

	if (data.length < expectLength) {
		return throwError(() => LedgerResponseCodes.SW_WRONG_DATA_LENGTH)
	}

	const hdPathResult = hdPathFromBuffer(data)
	if (!hdPathResult.isOk()) {
		return throwError(() => LedgerResponseCodes.SW_DISPLAY_BIP32_PATH_FAIL)
	}
	const readNextBuffer = readBuffer(
		data.slice(1 + hdPathResult.value.pathComponents.length * 4),
	)

	const hashedDataLenght = readNextBuffer(1)._unsafeUnwrap().readUInt8()

	if (hashedDataLenght !== sha256HashByteCount) {
		throw new Error(`Expected ${sha256HashByteCount}.`)
	}

	const hashedData = readNextBuffer(hashedDataLenght)._unsafeUnwrap()
	const derivedNode = hdMasterNode.derive(hdPathResult.value)

	const privateKey = derivedNode.privateKey

	const requireConfirmation = p1 === 1

	if (requireConfirmation) {
		// Require confirmation on device
		promptUserForInputOnLedger.next({
			type: PromptUserForInputType.REQUIRE_CONFIRMATION,
			instruction: LedgerInstruction.DO_SIGN_HASH,
		})
	}

	const confirmRequest = !requireConfirmation
		? of(LedgerButtonPress.BOTH_CONFIRM)
		: usersInputOnLedger.pipe(
				tap(buttonPress => {
					if (buttonPress === LedgerButtonPress.LEFT_REJECT) {
						throw LedgerResponseCodes.SW_DENY
					}
				}),
		  )

	return confirmRequest.pipe(
		mergeMap(_ => toObservable(privateKey.sign(hashedData))),
		map((signature: SignatureT) => Buffer.from(signature.toDER(), 'hex')),
		map(signatureOnDERBuf =>
			Buffer.concat([
				Buffer.from([signatureOnDERBuf.length]),
				signatureOnDERBuf,
				Buffer.from([0x01]), // mocked signature.V
			]),
		),
	)
}

const emulateDoKeyExchange = (
	input: Readonly<{
		hdMasterNode: HDNodeT
		recorder: MockedLedgerNanoRecorderT
		apdu: RadixAPDUT
	}>,
): Observable<Buffer> => {
	const { apdu, hdMasterNode, recorder } = input
	const { data, p1 } = apdu
	const { usersInputOnLedger, promptUserForInputOnLedger } = recorder

	const expectLength = 1 + 20 + 1 + 65

	if (!data) {
		return throwError(() => LedgerResponseCodes.SW_WRONG_DATA_LENGTH)
	}

	if (data.length < expectLength) {
		return throwError(() => LedgerResponseCodes.SW_WRONG_DATA_LENGTH)
	}

	const hdPathResult = hdPathFromBuffer(data)
	if (!hdPathResult.isOk()) {
		return throwError(() => LedgerResponseCodes.SW_DISPLAY_BIP32_PATH_FAIL)
	}
	const readNextBuffer = readBuffer(
		data.slice(1 + hdPathResult.value.pathComponents.length * 4),
	)

	const pubKeyLenght = readNextBuffer(1)._unsafeUnwrap().readUInt8()
	if (pubKeyLenght !== 65) {
		throw new Error(`Expected ${65}.`)
	}
	const publicKeyOfOtherPartyBytes = readNextBuffer(
		pubKeyLenght,
	)._unsafeUnwrap()

	const publicKeyOfOtherPartyBytesResult = PublicKey.fromBuffer(
		publicKeyOfOtherPartyBytes,
	)
	if (!publicKeyOfOtherPartyBytesResult.isOk()) {
		return throwError(() => LedgerResponseCodes.SW_BAD_STATE)
	}
	const publicKeyOfOtherParty = publicKeyOfOtherPartyBytesResult.value
	const derivedNode = hdMasterNode.derive(hdPathResult.value)

	const privateKey = derivedNode.privateKey

	const requireConfirmation = p1 === 1

	if (requireConfirmation) {
		// Require confirmation on device
		promptUserForInputOnLedger.next({
			type: PromptUserForInputType.REQUIRE_CONFIRMATION,
			instruction: LedgerInstruction.DO_KEY_EXCHANGE,
		})
	}

	const confirmRequest = !requireConfirmation
		? of(LedgerButtonPress.BOTH_CONFIRM)
		: usersInputOnLedger.pipe(
				tap(buttonPress => {
					if (buttonPress === LedgerButtonPress.LEFT_REJECT) {
						throw LedgerResponseCodes.SW_DENY
					}
				}),
		  )

	return confirmRequest.pipe(
		mergeMap(_ =>
			toObservable(privateKey.diffieHellman(publicKeyOfOtherParty)),
		),
		map((ecPoint: ECPointOnCurveT) => ecPoint.toBuffer(true)),
		map(sharedKeyBuf =>
			Buffer.concat([Buffer.from([sharedKeyBuf.length]), sharedKeyBuf]),
		),
	)
}

export enum LedgerButtonPress {
	LEFT_REJECT = 'LEFT_REJECT',
	RIGHT_ACCEPT = 'RIGHT_ACCEPT',
	BOTH_CONFIRM = 'BOTH',
}

export enum PromptUserForInputType {
	REQUIRE_CONFIRMATION,
}

export type PromptUserForInput = Readonly<{
	type: PromptUserForInputType
	instruction: LedgerInstruction
}>

const emulateGetPublicKey = (
	input: Readonly<{
		recorder: MockedLedgerNanoRecorderT
		hdMasterNode: HDNodeT
		apdu: RadixAPDUT
	}>,
): Observable<Buffer> => {
	const { apdu, hdMasterNode, recorder } = input
	const { usersInputOnLedger, promptUserForInputOnLedger } = recorder

	const { p1, p2, data } = apdu
	if (p1 !== 0 && p1 !== 1) {
		return throwError(() => LedgerResponseCodes.SW_WRONG_P1P2)
	}
	if (p2 !== 0 && p2 !== 1 && p2 !== 2) {
		return throwError(() => LedgerResponseCodes.SW_WRONG_P1P2)
	}

	const hdPathResult = hdPathFromBuffer(data)
	if (!hdPathResult.isOk()) {
		return throwError(() => LedgerResponseCodes.SW_DISPLAY_BIP32_PATH_FAIL)
	}
	const derivedNode = hdMasterNode.derive(hdPathResult.value)

	const publicKey = derivedNode.publicKey
	const pubKeyCompressed = publicKey.asData({ compressed: true })

	const mockedChainCode = Buffer.from(
		'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
		'hex',
	)

	const response = Buffer.concat([
		Buffer.from([pubKeyCompressed.length]),
		pubKeyCompressed,
		Buffer.from([mockedChainCode.length]),
		mockedChainCode,
	])

	const requireConfirmation = p1 === 1
	// const verifyAddressForNetwork: NetworkT | undefined =
	// 	p2 !== 0 ? (p2 === 1 ? NetworkT.MAINNET : NetworkT.BETANET) : undefined

	const promptForInput = (): void => {
		// Require confirmation on device
		promptUserForInputOnLedger.next({
			type: PromptUserForInputType.REQUIRE_CONFIRMATION,
			instruction: LedgerInstruction.GET_PUBLIC_KEY,
		})
	}

	let expectedInputsFromUser = 0
	if (requireConfirmation) {
		expectedInputsFromUser += 1
		promptForInput()

		// if (verifyAddressForNetwork) {
		// 	expectedInputsFromUser += 1
		// 	promptForInput()
		// }
	}

	return !requireConfirmation
		? of(response)
		: usersInputOnLedger.pipe(
				map(
					(buttonPress): Buffer => {
						if (buttonPress === LedgerButtonPress.LEFT_REJECT) {
							throw LedgerResponseCodes.SW_DENY
						} else {
							return response
						}
					},
				),
				take(expectedInputsFromUser),
		  )
}

const emulateGetAppName = (
	input: Readonly<{
		apdu: RadixAPDUT
	}>,
): Observable<Buffer> => {
	const { apdu } = input
	const { p1, p2 } = apdu
	if (p1 !== 0) {
		return throwError(() => LedgerResponseCodes.SW_WRONG_P1P2)
	}
	if (p2 !== 0) {
		return throwError(() => LedgerResponseCodes.SW_WRONG_P1P2)
	}
	const buf = Buffer.from('Radix', 'utf8')
	return of(buf)
}

const emulateGetVersion = (
	input: Readonly<{
		hardcodedVersion: SemVerT
		apdu: RadixAPDUT
	}>,
): Observable<Buffer> => {
	const { apdu, hardcodedVersion } = input
	const { p1, p2, data } = apdu
	if (p1 !== 0) {
		return throwError(() => LedgerResponseCodes.SW_WRONG_P1P2)
	}
	if (p2 !== 0) {
		return throwError(() => LedgerResponseCodes.SW_WRONG_P1P2)
	}
	if (data !== undefined) {
		return throwError(() => LedgerResponseCodes.SW_WRONG_DATA_LENGTH)
	}

	const buf = Buffer.alloc(3)
	buf.writeUInt8(hardcodedVersion.major, 0)
	buf.writeUInt8(hardcodedVersion.minor, 1)
	buf.writeUInt8(hardcodedVersion.patch, 2)

	return of(buf)
}

export const emulateSend = (
	input: Readonly<{
		recorder: MockedLedgerNanoRecorderT
		hdMasterNode: HDNodeT
		hardcodedVersion: SemVerT
	}>,
): ((apdu: RadixAPDUT) => Observable<Buffer>) => {
	const { hardcodedVersion } = input
	return (apdu: RadixAPDUT): Observable<Buffer> => {
		log.debug(`📲 Emulating sending of APDU.`)
		const { cla, ins } = apdu

		if (cla !== radixCLA) {
			return throwError(() => LedgerResponseCodes.SW_CLA_NOT_SUPPORTED)
		}

		switch (ins) {
			case LedgerInstruction.GET_APP_NAME: {
				return emulateGetAppName({
					apdu,
				})
			}
			case LedgerInstruction.GET_VERSION: {
				return emulateGetVersion({
					hardcodedVersion,
					apdu,
				})
			}
			case LedgerInstruction.GET_PUBLIC_KEY: {
				return emulateGetPublicKey({
					...input,
					apdu,
				})
			}
			case LedgerInstruction.DO_KEY_EXCHANGE: {
				return emulateDoKeyExchange({
					...input,
					apdu,
				})
			}
			case LedgerInstruction.DO_SIGN_HASH: {
				return emulateDoSignHash({
					...input,
					apdu,
				})
			}
			default: {
				throw new Error(
					`Not yet mocked instruction: ${LedgerInstruction[ins]}`,
				)
			}
		}
	}
}
