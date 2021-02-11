import { Hasher, sha256, radixHash, sha512, sha512Twice } from '../src/_index'

const testHash = (testVector: {
	hasher: Hasher
	input: Buffer
	expected: string
}): void => {
	const digest = testVector.hasher(testVector.input)
	const calculated = digest.toString('hex')
	const expected = testVector.expected
	expect(calculated).toBe(expected)
}

const testHashText = (testVector: {
	hasher: Hasher
	plainText: string
	expected: string
}): void => {
	const plainText = testVector.plainText
	const input = Buffer.from(plainText, 'utf-8')
	testHash({
		...testVector,
		input,
	})
}

describe('hashing', () => {
	// https://www.di-mgt.com.au/sha_testvectors.html
	it('can produce sha256 digests', () => {
		testHashText({
			hasher: sha256,
			plainText: 'abc',
			expected:
				'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
		})
	})

	it('can produce sha256 twice digests', () => {
		testHashText({
			hasher: radixHash,
			plainText: 'hello',
			expected:
				'9595c9df90075148eb06860365df33584b75bff782a510c6cd4883a419833d50',
		})
	})

	it('can produce sha512 digests', () => {
		// https://www.di-mgt.com.au/sha_testvectors.html
		testHashText({
			hasher: sha512,
			plainText: 'abc',
			expected:
				'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f',
		})
	})

	it('can produce sha512 twice digests', () => {
		testHashText({
			hasher: sha512Twice,
			plainText: 'Hello Radix',
			expected:
				'4aff9c50959c7bb7d85438289a68e8f8aa6d635b767a125bff02831c3689975006744079ad6ff887796f1dbfedd7c954676c3bf0a36e26b3a415b94b0484a73d',
		})
	})
})
