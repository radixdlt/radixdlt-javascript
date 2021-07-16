import { combine, err, ok, Result } from 'neverthrow'
import {
	BytesT,
	Ins_DOWN,
	Ins_END,
	Ins_HEADER,
	Ins_LDOWN,
	Ins_MSG,
	Ins_SIG,
	Ins_SYSCALL,
	Ins_UP,
	Ins_VREAD,
	InstructionT,
	InstructionType,
	SubstateIdT,
	TXSig,
} from './_types'
import { Bytes } from './bytes'
import { TxSignature } from './txSignature'
import { Substate } from './substate'
import { SubstateId } from './substateId'
import { BufferReaderT, Byte } from '@radixdlt/util'

const parseFromBufferReader = (
	bufferReader: BufferReaderT,
): Result<InstructionT, Error> => {
	const parseSubstate = () => Substate.parseFromBufferReader(bufferReader)
	return bufferReader
		.readNextBuffer(1)
		.map(b => ({
			insBuf: b,
			instructionType: b.readUInt8(0) as InstructionType,
		}))
		.andThen(
			(ii): Result<InstructionT, Error> => {
				const { insBuf, instructionType } = ii
				switch (instructionType) {
					case InstructionType.END:
						return ok({
							instructionType,
							toBuffer: () => insBuf,
							toString: () => 'END',
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
									`UP(${substate.toString().trimStart()})`,
								toHumanReadableString: () => {
									if (!substate.toHumanReadableString) {
										return `UP(${substate
											.toString()
											.trimStart()})`
									}
									return `UP(${substate
										.toHumanReadableString()
										.trimStart()})`
								},
							}),
						)
					case InstructionType.DOWN:
					case InstructionType.READ:
						return SubstateId.parseFromBufferReader(
							bufferReader,
						).map((substateId: SubstateIdT) => ({
							instructionType,
							substateId,
							toBuffer: () =>
								Buffer.concat([insBuf, substateId.toBuffer()]),
							toString: () =>
								`${InstructionType[instructionType]
								}(${substateId.toString()})`,
						}))
					case InstructionType.LDOWN:
						return bufferReader.readNextBuffer(2).map(
							(substateIndexBytes): Ins_LDOWN => {
								const substateIndex = substateIndexBytes.readUInt16BE(
									0,
								)
								return {
									substateIndex,
									instructionType,
									toBuffer: () =>
										Buffer.concat([
											insBuf,
											substateIndexBytes,
										]),
									toString: () =>
										`LDOWN(${substateIndex.toString()})`,
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
								toString: () => `MSG(${bytes.toString()})`,
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
									`SIG(0x${signature
										.toBuffer()
										.toString('hex')})`,
							}),
						)
					case InstructionType.SYSCALL:
						return Bytes.fromBufferReader(bufferReader).map(
							(callData: BytesT): Ins_SYSCALL => ({
								instructionType,
								callData,
								toBuffer: () =>
									Buffer.concat([
										insBuf,
										callData.toBuffer(),
									]),
								toString: () =>
									`SYSCALL(${callData.toString()})`,
							}),
						)

					case InstructionType.HEADER:
						return combine([
							bufferReader.readNextBuffer(1),
							bufferReader.readNextBuffer(1),
						])
							.map(resList => {
								const versionBuf = resList[0]
								const flagBuf = resList[1]
								const version = versionBuf.readUInt8(0) as Byte
								const flag = flagBuf.readUInt8(0) as Byte
								const buffer = Buffer.concat([
									versionBuf,
									flagBuf,
								])
								return { version, flag, buffer }
							})
							.map(
								(partial): Ins_HEADER => ({
									...partial,
									instructionType,
									toBuffer: () =>
										Buffer.concat([insBuf, partial.buffer]),
									toString: () =>
										`HEADER(${partial.version.toString()}, ${partial.flag.toString()})`,
								}),
							)
					case InstructionType.VREAD:
						return Bytes.fromBufferReader(bufferReader).map(
							(callData: BytesT): Ins_VREAD => ({
								instructionType,
								callData,
								toBuffer: () =>
									Buffer.concat([
										insBuf,
										callData.toBuffer(),
									]),
								toString: () =>
									`VREAD(${callData.toString()})`,
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
