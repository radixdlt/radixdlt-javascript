import {
	BIP44ChangeIndex,
	HDNodeT,
	HDPathRadix,
	HDPathRadixT,
} from '@radixdlt/account'
import { LedgerInstruction, LedgerResponseCodes, SemVerT } from '../../_types'
import { WLTSend, WLTSendAPDU } from './_types'
import { MockedLedgerNanoRecorderT, radixCLA } from '../_types'
import { ledgerInstruction } from '../ledgerInstruction'
import { err, ok, Result } from 'neverthrow'
import { Subscription } from 'rxjs'
import { PublicKey } from '@radixdlt/crypto'

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
	const account = data.readInt32BE(0)
	const changeNum = data.readInt32BE(4)
	if (!(changeNum === 1 || changeNum === 0)) {
		return err(
			new Error(
				`Expected second BIP32 path componet to be 0 or 1, but got value '${changeNum}'`,
			),
		)
	}
	const change: BIP44ChangeIndex = changeNum
	const index = data.readInt32BE(8)
	const hdPath = HDPathRadix.create({
		account,
		change,
		address: {
			index,
			isHardened: true,
		},
	})
	return ok(hdPath)
}

const emulateDoSignHash = (
	input: Readonly<{
		hdMasterNode: HDNodeT
		recorder: MockedLedgerNanoRecorderT
		apdu: WLTSendAPDU
	}>,
): Promise<Buffer> => {
	const subs = new Subscription()
	const { apdu, hdMasterNode, recorder } = input
	const { data, p1 } = apdu
	const { usersInputOnLedger, promptUserForInputOnLedger } = recorder

	const sha256HashByteCount = 32
	const expectLength = pathDataByteCount + sha256HashByteCount

	if (!data || data.length < expectLength) {
		return Promise.reject(LedgerResponseCodes.SW_INVALID_PARAM)
	}

	const hdPathResult = hdPathFromBuffer(data)
	if (!hdPathResult.isOk()) {
		return Promise.reject(LedgerResponseCodes.SW_INVALID_PARAM)
	}
	const hashedData = data.slice(pathDataByteCount)
	const derivedNode = hdMasterNode.derive(hdPathResult.value)

	const privateKey = derivedNode.privateKey

	return new Promise((resolve, reject) => {
		void privateKey
			// .diffieHellman(publicKeyOfOtherParty)
			.sign(hashedData)
			.map((a) => a.toDER())
			.map((der) => Buffer.from(der, 'hex'))
			.match(
				(buf) => {
					if (p1 === 1) {
						subs.add(
							usersInputOnLedger.subscribe({
								next: (userInput) => {
									if (
										userInput ===
										LedgerButtonPress.LEFT_REJECT
									) {
										reject(
											LedgerResponseCodes.SW_USER_REJECTED,
										)
									} else {
										resolve(buf)
									}
								},
							}),
						)

						// Require confirmation on device
						promptUserForInputOnLedger.next({
							type: PromptUserForInputType.REQUIRE_CONFIRMATION,
							instruction: LedgerInstruction.DO_SIGN_HASH,
						})
					} else {
						// TODO need to append status code and length of data?
						resolve(buf)
					}
				},
				(error) => reject(error),
			)
	})
}

const emulateDoKeyExchange = (
	input: Readonly<{
		hdMasterNode: HDNodeT
		recorder: MockedLedgerNanoRecorderT
		apdu: WLTSendAPDU
	}>,
): Promise<Buffer> => {
	const subs = new Subscription()
	const { apdu, hdMasterNode, recorder } = input
	const { data, p1 } = apdu
	const { usersInputOnLedger, promptUserForInputOnLedger } = recorder

	const expectLength = pathDataByteCount + publicKeyByteCount

	if (!data || data.length < expectLength) {
		return Promise.reject(LedgerResponseCodes.SW_INVALID_PARAM)
	}

	const hdPathResult = hdPathFromBuffer(data)
	if (!hdPathResult.isOk()) {
		return Promise.reject(LedgerResponseCodes.SW_INVALID_PARAM)
	}
	const publicKeyOfOtherPartyBytes = data.slice(pathDataByteCount)
	const publicKeyOfOtherPartyBytesResult = PublicKey.fromBuffer(
		publicKeyOfOtherPartyBytes,
	)
	if (!publicKeyOfOtherPartyBytesResult.isOk()) {
		return Promise.reject(LedgerResponseCodes.SW_INVALID_PARAM)
	}
	const publicKeyOfOtherParty = publicKeyOfOtherPartyBytesResult.value
	const derivedNode = hdMasterNode.derive(hdPathResult.value)

	const privateKey = derivedNode.privateKey

	return new Promise((resolve, reject) => {
		void privateKey
			.diffieHellman(publicKeyOfOtherParty)
			.map((a) => a.toBuffer())
			.match(
				(buf) => {
					if (p1 === 1) {
						subs.add(
							usersInputOnLedger.subscribe({
								next: (userInput) => {
									if (
										userInput ===
										LedgerButtonPress.LEFT_REJECT
									) {
										reject(
											LedgerResponseCodes.SW_USER_REJECTED,
										)
									} else {
										resolve(buf)
									}
								},
							}),
						)

						// Require confirmation on device
						promptUserForInputOnLedger.next({
							type: PromptUserForInputType.REQUIRE_CONFIRMATION,
							instruction: LedgerInstruction.DO_KEY_EXCHANGE,
						})
					} else {
						// TODO need to append status code and length of data?
						resolve(buf)
					}
				},
				(error) => reject(error),
			)
	})
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
		apdu: WLTSendAPDU
	}>,
): Promise<Buffer> => {
	const subs = new Subscription()
	const { apdu, hdMasterNode, recorder } = input
	const { usersInputOnLedger, promptUserForInputOnLedger } = recorder

	const { p1, data } = apdu
	if (p1 > 1) {
		return Promise.reject(LedgerResponseCodes.SW_INVALID_PARAM)
	}

	const hdPathResult = hdPathFromBuffer(data)
	if (!hdPathResult.isOk()) {
		return Promise.reject(LedgerResponseCodes.SW_INVALID_PARAM)
	}
	const derivedNode = hdMasterNode.derive(hdPathResult.value)

	const publicKey = derivedNode.publicKey
	const response = publicKey.asData({ compressed: true })

	return new Promise((resolve, reject) => {
		if (p1 === 1) {
			subs.add(
				usersInputOnLedger.subscribe({
					next: (userInput) => {
						if (userInput === LedgerButtonPress.LEFT_REJECT) {
							reject(LedgerResponseCodes.SW_USER_REJECTED)
						} else {
							resolve(response)
						}
					},
				}),
			)

			// Require confirmation on device
			promptUserForInputOnLedger.next({
				type: PromptUserForInputType.REQUIRE_CONFIRMATION,
				instruction: LedgerInstruction.GET_PUBLIC_KEY,
			})
		} else {
			// TODO need to append status code and length of data?
			resolve(response)
		}
	})
}

const emulateGetVersion = (
	input: Readonly<{
		hardcodedVersion: SemVerT
		apdu: WLTSendAPDU
	}>,
): Promise<Buffer> => {
	const { apdu, hardcodedVersion } = input
	const { p1, p2, data } = apdu
	if (p1 !== 0) {
		return Promise.reject(LedgerResponseCodes.SW_INVALID_PARAM)
	}
	if (p2 !== 0) {
		return Promise.reject(LedgerResponseCodes.SW_INVALID_PARAM)
	}
	if (data !== undefined) {
		return Promise.reject(LedgerResponseCodes.SW_INVALID_PARAM)
	}

	const buf = Buffer.alloc(3)
	buf.writeUInt8(hardcodedVersion.major, 0)
	buf.writeUInt8(hardcodedVersion.minor, 1)
	buf.writeUInt8(hardcodedVersion.patch, 2)

	return Promise.resolve(buf)
}

export const emulateSend = (
	input: Readonly<{
		recorder: MockedLedgerNanoRecorderT
		hdMasterNode: HDNodeT
		hardcodedVersion: SemVerT
	}>,
): WLTSend => {
	const { hardcodedVersion } = input
	return (
		cla: number,
		ins: number,
		p1: number,
		p2: number,
		data?: Buffer,
		statusList?: ReadonlyArray<number>,
	): Promise<Buffer> => {
		if (cla !== radixCLA) {
			return Promise.reject(LedgerResponseCodes.SW_INCORRECT_CLA)
		}
		const instructionResult = ledgerInstruction(ins)
		if (!instructionResult.isOk()) {
			return Promise.reject(LedgerResponseCodes.SW_INVALID_INSTRUCTION)
		}
		const instruction = instructionResult.value
		const apdu: WLTSendAPDU = {
			cla,
			ins,
			p1,
			p2,
			data,
			statusList,
		}

		switch (instruction) {
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
