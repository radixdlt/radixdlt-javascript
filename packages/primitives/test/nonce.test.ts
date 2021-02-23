import { randomNonce, nonce, NONCE_JSON_TAG } from '../src/nonce'
import * as Long from 'long'

describe('Nonce', () => {
	it('can be generated', () => {
		const nonce = randomNonce()
		expect(nonce.value).toBeTruthy()
	})

	it('should be able to DSON encode nonce with small value', () => {
		const nonce_ = nonce(237)
		const dson = nonce_.toDSON()._unsafeUnwrap()
		expect(dson.toString('hex')).toBe('18ed')
	})
	it('should be able to DSON encode nonce with large value', () => {
		const nonce_ = nonce(Long.MAX_VALUE)
		const dson = nonce_.toDSON()._unsafeUnwrap()
		expect(dson.toString('hex')).toBe('1b7fffffffffffffff')
	})

	it('should be able to JSON encode nonce with small value', () => {
		const nonce_ = nonce(237)
		const json = nonce_.toJSON()._unsafeUnwrap()
		expect(json).toBe(`${NONCE_JSON_TAG}237`)
	})

	it('should be able to JSON encode nonce with large value', () => {
		const nonce_ = nonce(Long.MAX_VALUE)
		const json = nonce_.toJSON()._unsafeUnwrap()
		expect(json).toBe(`${NONCE_JSON_TAG}9223372036854775807`)
	})
})
