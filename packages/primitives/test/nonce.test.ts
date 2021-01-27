import { randomNonce, nonce } from '../src/nonce'
import * as Long from 'long'

describe('Nonce', () => {
	it('can be generated', () => {
		const nonce = randomNonce()
		expect(nonce.value).toBeTruthy()
	})

	it('should be able to encode nonce with small value', () => {
		const nonce_ = nonce(237)
		const dson = nonce_.toDSON()._unsafeUnwrap()
		expect(dson.toString('hex')).toBe('18ed')
	})
	it('should be able to encode nonce with large value', () => {
		const nonce_ = nonce(Long.MAX_VALUE)
		const dson = nonce_.toDSON()._unsafeUnwrap()
		expect(dson.toString('hex')).toBe('1b7fffffffffffffff')
	})
})
