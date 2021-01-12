import { randomNonce } from '../src/nonce'

describe('Nonce', () => {
	it('can be generated', () => {
		const nonce = randomNonce()
		expect(nonce.value).toBeTruthy()
	})
})
