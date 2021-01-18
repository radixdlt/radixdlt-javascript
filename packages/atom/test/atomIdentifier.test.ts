import { atomIdentifier } from '../src/atomIdentifier'

describe('AtomIdentifier', () => {
	it('can check for equality', () => {
		const a0 = atomIdentifier(buffer0)._unsafeUnwrap()
		const b0 = atomIdentifier(buffer0)._unsafeUnwrap()
		const a1 = atomIdentifier(buffer1)._unsafeUnwrap()

		expect(a0.equals(b0)).toBe(true)
		expect(a0.equals(a1)).toBe(false)
	})

	it('can be converted to string', () => {
		const aid = atomIdentifier(buffer0)._unsafeUnwrap()
		expect(aid.toString()).toBe(deadbeefString)
	})

	it('can be created from hex string', () => {
		const aid = atomIdentifier(deadbeefString)._unsafeUnwrap()
		expect(aid.toString()).toBe(deadbeefString)
	})

	const deadbeefString =
		'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef'
	const buffer0 = Buffer.from(deadbeefString, 'hex')
	const buffer1 = Buffer.from(
		'FadedBeeFadedBeeFadedBeeFadedBeeFadedBeeFadedBeeFadedBeeFadedBee',
		'hex',
	)
})
