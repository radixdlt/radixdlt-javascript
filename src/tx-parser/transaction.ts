import { err, ok, Result } from 'neverthrow'
import { InstructionT, TransactionT } from './_types'
import { Instruction } from './instruction'
import { sha256Twice } from '@crypto'
import { BufferReader } from '@util'
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

  const toString = (): string =>
    [
      'Instructions:',
      instructions
        .map(i => `|- ${i.toString()}`)
        // .map(s => s.trimStart())
        .join('\n'),
    ].join('\n')

  return ok({
    instructions,
    txID,
    toBuffer: () => reassembledTxBlob,
    toString,
  })
}

export const Transaction = {
  fromBuffer,
}
