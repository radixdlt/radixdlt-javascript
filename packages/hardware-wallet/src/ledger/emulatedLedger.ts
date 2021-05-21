import { LedgerInstruction, LedgerResponseCodes, SemVerT } from '../_types'
import { MockedLedgerNanoRecorderT, RadixAPDUT, radixCLA } from './_types'
import { err, ok, Result } from 'neverthrow'
import { Observable, of, throwError } from 'rxjs'
import {
	BIP44ChangeIndex,
	HDNodeT,
	HDPathRadix,
	HDPathRadixT,
	PublicKey,
	SignatureT,
	ECPointOnCurveT,
	hardenedIncrement,
} from '@radixdlt/crypto'
import { map, mergeMap, take, tap } from 'rxjs/operators'
import { log, toObservable } from '@radixdlt/util'

const pathDataByteCount = 12
const publicKeyByteCount = 64

const hdPathFromBuffer = (
	data: Buffer | undefined,
): Result<HDPathRadixT, Error> => {
	if (!data || data.length < pathDataByteCount) {
		return err(
			new Error(
				`No data, or too short, expected #${pathDataByteCount} bytes.`,
			),
		)
	}
	const accountRead = data.readUInt32BE(0)
	const isAccountHardened = accountRead >= hardenedIncrement
	if (!isAccountHardened) {
		return err(
			new Error(`Expected BIP32 path component 'account' to be hardened`),
		)
	}
	const account = accountRead - hardenedIncrement
	const changeNum = data.readUInt32BE(4)
	if (!(changeNum === 1 || changeNum === 0)) {
		return err(
			new Error(
				`Expected BIP32 path component 'change' to be 0 or 1, but got value '${changeNum}'`,
			),
		)
	}
	const change: BIP44ChangeIndex = changeNum
	let index = data.readUInt32BE(8)
	let isHardened = false
	if (index >= hardenedIncrement) {
		isHardened = true
		index -= hardenedIncrement
	}
	const hdPath = HDPathRadix.create({
		account,
		change,
		address: {
			index,
			isHardened,
		},
	})
	return ok(hdPath)
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
	const expectLength = pathDataByteCount + sha256HashByteCount

	if (!data) {
		return throwError(() => LedgerResponseCodes.SW_INVALID_PARAM)
	}

	if (data.length < expectLength) {
		return throwError(() => LedgerResponseCodes.SW_INVALID_PARAM)
	}

	const hdPathResult = hdPathFromBuffer(data)
	if (!hdPathResult.isOk()) {
		return throwError(() => LedgerResponseCodes.SW_INVALID_PARAM)
	}
	const hashedData = data.slice(pathDataByteCount)
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
				tap((buttonPress) => {
					if (buttonPress === LedgerButtonPress.LEFT_REJECT) {
						throw LedgerResponseCodes.SW_USER_REJECTED
					}
				}),
		  )

	return confirmRequest.pipe(
		mergeMap((_) => {
			return toObservable(privateKey.sign(hashedData))
		}),
		map((signature: SignatureT) => {
			return Buffer.concat([
				Buffer.from(signature.r.toString(16), 'hex'),
				Buffer.from(signature.s.toString(16), 'hex'),
			])
		}),
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

	const expectLength = pathDataByteCount + publicKeyByteCount

	if (!data) {
		return throwError(() => LedgerResponseCodes.SW_INVALID_PARAM)
	}

	if (data.length < expectLength) {
		return throwError(() => LedgerResponseCodes.SW_INVALID_PARAM)
	}

	const hdPathResult = hdPathFromBuffer(data)
	if (!hdPathResult.isOk()) {
		return throwError(() => LedgerResponseCodes.SW_INVALID_PARAM)
	}
	const publicKeyOfOtherPartyBytes = data.slice(pathDataByteCount)
	const publicKeyOfOtherPartyBytesResult = PublicKey.fromBuffer(
		publicKeyOfOtherPartyBytes,
	)
	if (!publicKeyOfOtherPartyBytesResult.isOk()) {
		return throwError(() => LedgerResponseCodes.SW_INVALID_PARAM)
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
				tap((buttonPress) => {
					if (buttonPress === LedgerButtonPress.LEFT_REJECT) {
						throw LedgerResponseCodes.SW_USER_REJECTED
					}
				}),
		  )

	return confirmRequest.pipe(
		mergeMap((_) => {
			return toObservable(privateKey.diffieHellman(publicKeyOfOtherParty))
		}),
		map((ecPoint: ECPointOnCurveT) => ecPoint.toBuffer()),
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

	const { p1, data } = apdu
	if (p1 > 1) {
		return throwError(() => LedgerResponseCodes.SW_INVALID_PARAM)
	}

	const hdPathResult = hdPathFromBuffer(data)
	if (!hdPathResult.isOk()) {
		return throwError(() => LedgerResponseCodes.SW_INVALID_PARAM)
	}
	const derivedNode = hdMasterNode.derive(hdPathResult.value)

	const publicKey = derivedNode.publicKey
	const response = publicKey.asData({ compressed: true })

	const requireConfirmation = p1 === 1

	if (requireConfirmation) {
		// Require confirmation on device
		promptUserForInputOnLedger.next({
			type: PromptUserForInputType.REQUIRE_CONFIRMATION,
			instruction: LedgerInstruction.GET_PUBLIC_KEY,
		})
	}

	return !requireConfirmation
		? of(response)
		: usersInputOnLedger.pipe(
				map(
					(buttonPress): Buffer => {
						if (buttonPress === LedgerButtonPress.LEFT_REJECT) {
							throw LedgerResponseCodes.SW_USER_REJECTED
						} else {
							return response
						}
					},
				),
				take(1),
		  )
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
		return throwError(() => LedgerResponseCodes.SW_INVALID_PARAM)
	}
	if (p2 !== 0) {
		return throwError(() => LedgerResponseCodes.SW_INVALID_PARAM)
	}
	if (data !== undefined) {
		return throwError(() => LedgerResponseCodes.SW_INVALID_PARAM)
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
			return throwError(() => LedgerResponseCodes.CLA_NOT_SUPPORTED)
		}

		switch (ins) {
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
			case LedgerInstruction.GET_VERSION: {
				return emulateGetVersion({
					hardcodedVersion,
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
