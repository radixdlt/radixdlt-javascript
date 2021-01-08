import { magicFromNumber } from '../src/_index'

const vectors = [
	{ magic: 0, expectedByte: 0 },
	{ magic: 1, expectedByte: 1 },
	{ magic: -1, expectedByte: 255 },
	{ magic: -2, expectedByte: 254 },
	{ magic: 255, expectedByte: 255 },
	{ magic: 256, expectedByte: 0 },
	{ magic: 257, expectedByte: 1 },
	{ magic: 1337, expectedByte: 57 },
	{ magic: 123456789, expectedByte: 21 },
	{ magic: -123456789, expectedByte: 235 },
	{ magic: 987654321, expectedByte: 177 },
	{ magic: -987654321, expectedByte: 79 },
]

describe('magic', () => {
	it('can return magic byte', () => {
		const testVector = (vector: {
			magic: number
			expectedByte: number
		}): void => {
			const magic = magicFromNumber(vector.magic)
			const magicByte = magic.byte
			const expectedByte = vector.expectedByte

			expect(magicByte).toBe(expectedByte)
		}

		vectors.forEach(testVector)
	})
})
