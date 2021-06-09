import { BufferReaderT, SubstateIdT } from './_types'
import { combine, Result } from 'neverthrow'
import { noTab } from './removeWhitespace'

const parseFromBufferReader = (
	bufferReader: BufferReaderT,
): Result<SubstateIdT, Error> =>
	combine([
		bufferReader.readNextBuffer(32),
		bufferReader.readNextBuffer(4),
	]).map(resList => {
		const hash = resList[0]
		const index = resList[1].readUInt32BE()

		const buffer = Buffer.concat([resList[0], resList[1]])

		return {
			hash,
			index,
			toBuffer: () => buffer,
			toString: () =>
				noTab(
					`SubstateId { hash: 0x${hash.toString(
						'hex',
					)}, index: ${index} }`,
				),
		}
	})

export const SubstateId = {
	parseFromBufferReader,
}
