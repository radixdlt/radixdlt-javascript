import { BIP44ChangeIndex, HDNodeT, HDPathRadix } from '@radixdlt/account'
import { LedgerInstruction, LedgerResponseCodes, SemVerT } from '../../_types'
import { WLTSend } from './_types'
import { radixCLA } from '../_types'
import { ledgerInstruction } from '../ledgerInstruction'

const emulateGetPublicKey = (
	input: Readonly<{
		hdMasterNode: HDNodeT
		apdu: Readonly<{
			cla: number
			ins: number
			p1: number
			p2: number
			data?: Buffer
			statusList?: ReadonlyArray<number>
		}>
	}>,
): Promise<Buffer> => {
	const { apdu, hdMasterNode } = input
	const { p1, data } = apdu
	if (p1 > 1) {
		return Promise.reject(LedgerResponseCodes.SW_INVALID_PARAM)
	}
	if (!data || data.length !== 12) {
		return Promise.reject(LedgerResponseCodes.SW_INVALID_PARAM)
	}
	const account = data.readInt32BE(0)
	const changeNum = data.readInt32BE(4)
	if (!(changeNum === 1 || changeNum === 0)) {
		return Promise.reject(LedgerResponseCodes.SW_INVALID_PARAM)
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
	const derivedNode = hdMasterNode.derive(hdPath)
	const publicKey = derivedNode.publicKey
	const response = publicKey.asData({ compressed: true })

	if (p1 === 1) {
		// require confirmation on device, how to emulate?
		return Promise.reject(
			'Cannot emulate device requiring user to confirm.',
		)
	}

	// TODO need to append status code and length of data?
	return Promise.resolve(response)
}

const emulateGetVersion = (
	input: Readonly<{
		hardcodedVersion: SemVerT
		apdu: Readonly<{
			cla: number
			ins: number
			p1: number
			p2: number
			data?: Buffer
			statusList?: ReadonlyArray<number>
		}>
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
		hdMasterNode: HDNodeT
		hardcodedVersion: SemVerT
	}>,
): WLTSend => {
	const { hdMasterNode, hardcodedVersion } = input
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
		// const instruction: LedgerInstruction | undefined = LedgerInstruction[LedgerInstruction[ins]]
		const instructionResult = ledgerInstruction(ins)
		if (!instructionResult.isOk()) {
			return Promise.reject(LedgerResponseCodes.SW_INVALID_INSTRUCTION)
		}
		const instruction = instructionResult.value

		switch (instruction) {
			case LedgerInstruction.GET_PUBLIC_KEY: {
				return emulateGetPublicKey({
					hdMasterNode,
					apdu: {
						cla,
						ins,
						p1,
						p2,
						data,
						statusList,
					},
				})
			}
			case LedgerInstruction.GET_VERSION: {
				return emulateGetVersion({
					hardcodedVersion,
					apdu: {
						cla,
						ins,
						p1,
						p2,
						data,
						statusList,
					},
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
