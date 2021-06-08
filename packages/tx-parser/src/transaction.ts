import { err, ok, Result } from 'neverthrow'
import { BufferReader, InstructionT, TransactionT } from './_types'
import { Instruction } from './instruction'
import { sha256Twice } from '@radixdlt/crypto'

const fromBuffer = (blob: Buffer): Result<TransactionT, Error> => {
	const instructions: InstructionT[] = []

	const bufferReader = BufferReader.create(blob)

	while (!bufferReader.finishedParsing()) {
		const instructionRes = Instruction.parseFromBufferReader(bufferReader)
		if (instructionRes.isErr()) {
			return err(instructionRes.error)
		}
		const instruction = instructionRes.value
		instructions.push(instruction)
	}

	const reassembleBlob = (): Buffer =>
		instructions
			.map(i => i.toBuffer())
			.reduce((a, i) => Buffer.concat([a, i]), Buffer.alloc(0))

	const reassembledTxBlob = reassembleBlob()

	if (reassembledTxBlob.toString('hex') !== blob.toString('hex')) {
		throw new Error(
			`Incorrect implementation, reasambled blob NEQ original blob.`,
		)
	}

	const txID = (): string => sha256Twice(reassembledTxBlob).toString('hex')

	return ok({
		instructions,
		txID,
		toBuffer: () => reassembledTxBlob,
		toString: () =>
			`TX: { instructions: ${instructions
				.map(i => i.toString())
				.join('\n')} }`,
	})
}

export const Transaction = {
	fromBuffer,
}
