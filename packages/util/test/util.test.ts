import { secureRandomGenerator } from '../src/_index'

const testGenerateBytes = (byteCount: number): Buffer => {
	const bytes = secureRandomGenerator.randomSecureBytes(byteCount)
	expect(bytes.length).toBe(byteCount)
	return bytes
}

describe('util', () => {
	it('can securely generate random bytes', () => {
		const byteCount = 8
		const byteStrings = [...Array(1024)].map((_, i) => {
			return testGenerateBytes(byteCount).toString('hex')
		})
		const uniqueByteStrings = new Set(byteStrings)
		// Probability of collision is: 2^10/2^64 <=> 1/2^54 = 5e-17 <=> VERY low probability.
		expect(uniqueByteStrings.size).toBe(byteStrings.length)
	})
})
