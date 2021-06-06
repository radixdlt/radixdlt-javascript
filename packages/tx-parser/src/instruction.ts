import { combine, err, ok, Result } from 'neverthrow'
import {
	BufferReaderT,
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
	SubstateT,
	TXSig,
} from './_types'
import { Bytes } from './bytes'
import { TxSignature } from './txSignature'
import { Substate } from './substate'
import { SubstateId } from './substateId'
import { Byte } from '@radixdlt/util'

const parseFromBufferReader = (
	bufferReader: BufferReaderT,
): Result<InstructionT, Error> => {
	const parseSubstate = () => Substate.parseFromBufferReader(bufferReader)
	return bufferReader
		.readNextBuffer(1)
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
						return parseSubstate().map(
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
						return parseSubstate().map(
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
							parseSubstate(),
							Bytes.fromBufferReader(bufferReader),
						])
							.map(resList => {
								const substate = resList[0] as SubstateT
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
						return SubstateId.parseFromBufferReader(
							bufferReader,
						).map(
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
						return bufferReader.readNextBuffer(4).map(
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
						return Bytes.fromBufferReader(bufferReader).map(
							(bytes: BytesT): Ins_MSG => ({
								instructionType,
								bytes,
								toBuffer: () =>
									Buffer.concat([insBuf, bytes.toBuffer()]),
								toString: () =>
									`MSG: { bytes: ${bytes.toString()} }`,
							}),
						)
					case InstructionType.SIG:
						return TxSignature.fromBufferReader(bufferReader).map(
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
						return bufferReader
							.readNextBuffer(1)
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
					default:
						return err(
							new Error(
								`Unrecognized instruction type: ${insBuf.toString()}`,
							),
						)
				}
			},
		)
}

export const Instruction = {
	parseFromBufferReader,
}
