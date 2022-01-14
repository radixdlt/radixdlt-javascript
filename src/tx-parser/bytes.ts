import { Result } from 'neverthrow'
import { BytesT } from './_types'
import { BufferReaderT } from '@util'

const LENGTH_BYTES = 2

const fromBufferReader = (bufferReader: BufferReaderT): Result<BytesT, Error> =>
  bufferReader
    .readNextBuffer(LENGTH_BYTES)
    .map(b => b.readUInt16BE(0))
    .andThen((length: number) =>
      bufferReader.readNextBuffer(length).map(data => ({
        length,
        data,
      })),
    )
    .map(partial => {
      const lengthBuf = Buffer.alloc(LENGTH_BYTES)
      lengthBuf.writeUInt16BE(partial.length)

      const buffer = Buffer.concat([lengthBuf, partial.data])

      return {
        ...partial,
        toBuffer: () => buffer,
        toString: () => `0x${partial.data.toString('hex')}`,
      }
    })

export const Bytes = {
  fromBufferReader,
}
