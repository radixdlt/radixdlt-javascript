import { secureRandomGenerator } from '../src/_index'

export const mockErrorMsg = (msg: string): string => {
	const testFilePath = expect.getState().testPath
	const testFileName = testFilePath.split('/').reverse()[0]
	const testName = expect.getState().currentTestName.replaceAll(' ', '_')
	return `MOCKED_ERROR_${msg}_${testName}_in_${testFileName}`
}

const testGenerateBytes = (byteCount: number): string => {
	const bytes = secureRandomGenerator.randomSecureBytes(byteCount)
	expect(bytes.length).toBe(2 * byteCount)
	return bytes
}

describe('util', () => {
	it('can securely generate random bytes', () => {
		const byteCount = 8
		const byteStrings = [...Array(1024)].map((_, i) => {
			return testGenerateBytes(byteCount)
		})
		const uniqueByteStrings = new Set(byteStrings)
		// Probability of collision is: 2^10/2^64 <=> 1/2^54 = 5e-17 <=> VERY low probability.
		expect(uniqueByteStrings.size).toBe(byteStrings.length)
	})
})
