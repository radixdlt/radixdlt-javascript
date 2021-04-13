import { generateKeyPair } from '../src/elliptic-curve/keyPair'

describe('diffiehellman', () => {
	it('works between two', async () => {
		const alice = generateKeyPair()
		const bob = generateKeyPair()

		const dhAB = (
			await alice.privateKey.diffieHellman(bob.publicKey)
		)._unsafeUnwrap()
		const dhBA = (
			await bob.privateKey.diffieHellman(alice.publicKey)
		)._unsafeUnwrap()

		expect(dhAB.equals(dhBA)).toBe(true)
	})
})
