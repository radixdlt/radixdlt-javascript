import { combine, err, ok, Result } from 'neverthrow'
import {
	BytesT,
	Ins_DOWN,
	Ins_DOWNALL,
	Ins_END,
	Ins_LDOWN,
	Ins_MSG,
	Ins_SIG,
	Ins_UP,
	Ins_VDOWN,
	Ins_VDOWNARG,
	InstructionT,
	InstructionType,
	Substate,
	SubstateId,
	SubStateType,
	TransactionT,
	TXSig,
} from './_types'
import { Byte, readBuffer } from '@radixdlt/util'
import { Bytes } from './bytes'
import { TxSignature } from './txSignature'
import { Tokens } from './tokens'
import { PreparedStake } from './preparedStake'
import { PreparedUnstake } from './preparedUnstake'

export type ReadBuffer = (byteCount: number) => Result<Buffer, Error>

const substateIdFromBuffer = (
	readBuffer: ReadBuffer,
): Result<SubstateId, Error> =>
	combine([readBuffer(32), readBuffer(4)]).map(resList => {
		const hash = resList[0]
		const index = resList[1].readUInt32BE()

		const buffer = Buffer.concat([resList[0], resList[1]])

		return {
			hash,
			index,
			toBuffer: () => buffer,
			toString: () =>
				`SubstateId: { hash: ${hash.toString(
					'hex',
				)}, index: ${index} }`,
		}
	})

const fromBuffer = (blob: Buffer): Result<TransactionT, Error> => {
	const originalBlob = Buffer.alloc(blob.length)
	blob.copy(originalBlob)
	const instructions: InstructionT[] = []

	const readNextBuffer = readBuffer(blob)

	const readSubstate = (): Result<Substate, Error> =>
		readNextBuffer(1)
			.map(b => b.readUInt8())
			.map(n => n as SubStateType)
			.andThen(
				(substateType: SubStateType): Result<Substate, Error> => {
					switch (substateType) {
						case SubStateType.TOKENS:
							return Tokens.fromReadBuffer(readNextBuffer)
						case SubStateType.PREPARED_STAKE:
							return PreparedStake.fromReadBuffer(readNextBuffer)
						case SubStateType.PREPARED_UNSTAKE:
							return PreparedUnstake.fromReadBuffer(
								readNextBuffer,
							)
						default:
							throw new Error(
								`Substate of type: ${SubStateType[substateType]} not implemented.`,
							)
					}
				},
			)
	let iterations = 0
	while (blob.length > 0) {
		// console.log(`🔮 blob.length: ${blob.length}`)
		if (iterations === 1) {
			console.error(`❌ killed after #${iterations} iterations`)
		}
		readNextBuffer(1)
			.map(b => ({
				insBuf: b,
				instructionType: b.readUInt8() as InstructionType,
			}))
			.andThen(
				(ii): Result<InstructionT, Error> => {
					const { insBuf, instructionType } = ii
					switch (instructionType) {
						case InstructionType.END:
							return ok({
								instructionType,
								toBuffer: () => insBuf,
								toString: () =>
									`${InstructionType[instructionType]}: (Always empty)`,
							} as Ins_END)
						case InstructionType.UP:
							return readSubstate().map(
								(substate): Ins_UP => ({
									instructionType,
									substate,
									toBuffer: () =>
										Buffer.concat([
											insBuf,
											substate.toBuffer(),
										]),
									toString: () =>
										`UP: { substate: ${substate.toString()} }`,
								}),
							)
						case InstructionType.VDOWN:
							return readSubstate().map(
								(substate): Ins_VDOWN => ({
									instructionType,
									substate,
									toBuffer: () =>
										Buffer.concat([
											insBuf,
											substate.toBuffer(),
										]),
									toString: () =>
										`VDOWN: { substate: ${substate.toString()} }`,
								}),
							)
						case InstructionType.VDOWNARG:
							return combine([
								readSubstate(),
								Bytes.fromReadBuffer(readNextBuffer),
							])
								.map(resList => {
									const substate = resList[0] as Substate
									const argument = resList[1] as BytesT
									return { substate, argument }
								})
								.map(
									(partial): Ins_VDOWNARG => ({
										...partial,
										instructionType,
										toBuffer: () =>
											Buffer.concat([
												insBuf,
												partial.substate.toBuffer(),
												partial.argument.toBuffer(),
											]),
										toString: () =>
											`VDOWNARG: { substate: ${partial.substate.toString()}, argument: ${partial.argument.toString()} }`,
									}),
								)
						case InstructionType.DOWN:
							return substateIdFromBuffer(readNextBuffer).map(
								(substateId): Ins_DOWN => ({
									instructionType,
									substateId,
									toBuffer: () =>
										Buffer.concat([
											insBuf,
											substateId.toBuffer(),
										]),
									toString: () =>
										`DOWN: { substateId: ${substateId.toString()} }`,
								}),
							)
						case InstructionType.LDOWN:
							return readNextBuffer(4).map(
								(substateIndexBytes): Ins_LDOWN => {
									const substateIndex = substateIndexBytes.readUInt32BE()
									return {
										substateIndex,
										instructionType,
										toBuffer: () =>
											Buffer.concat([
												insBuf,
												substateIndexBytes,
											]),
										toString: () =>
											`LDOWN: { substateIndex: ${substateIndex.toString()} }`,
									}
								},
							)
						case InstructionType.MSG:
							return Bytes.fromReadBuffer(readNextBuffer).map(
								(bytes: BytesT): Ins_MSG => ({
									instructionType,
									bytes,
									toBuffer: () =>
										Buffer.concat([
											insBuf,
											bytes.toBuffer(),
										]),
									toString: () =>
										`MSG: { bytes: ${bytes.toString()} }`,
								}),
							)
						case InstructionType.SIG:
							return TxSignature.fromReadBuffer(
								readNextBuffer,
							).map(
								(signature: TXSig): Ins_SIG => ({
									instructionType,
									signature,
									toBuffer: () =>
										Buffer.concat([
											insBuf,
											signature.toBuffer(),
										]),
									toString: () =>
										`SIG: { signature: ${signature.toString()} }`,
								}),
							)
						case InstructionType.DOWNALL:
							return readNextBuffer(1)
								.map(b => b.readUInt8() as Byte)
								.map(
									(classId: Byte): Ins_DOWNALL => ({
										instructionType,
										classId,
										toBuffer: () =>
											Buffer.concat([
												insBuf,
												Buffer.from([classId]),
											]),
										toString: () =>
											`DOWNALL: { classId: ${classId.toString()} }`,
									}),
								)
					}
				},
			)
	}

	return ok({
		instructions,
		toBuffer: () => originalBlob,
		toString: () =>
			`TX: { instructions: ${instructions
				.map(i => i.toString())
				.join('\n')} }`,
	})
}

export const Transaction = {
	fromBuffer,
}
