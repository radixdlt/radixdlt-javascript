import { ResourceIdentifier } from '../src'
import { msgFromError } from '@radixdlt/util'

describe('rri_on_bech32_format', () => {

	it('xrd rri can be parsed from string', () => {
		const rriString = 'xrd_rb1qya85pwq'

		ResourceIdentifier.fromUnsafe(rriString).match(
			(rri) => {
				expect(rri.name).toBe('xrd')
				expect(rri.toString()).toBe(rriString)
			},
			(e) => {
				throw e
			}
		)
	})

	describe('test non happy paths', () => {
		it('rri checksum invalid bech32 string', () => {
			const rri = 'xrd_rb1qya85pw1' // "w1" should have been "wq";
			ResourceIdentifier.fromUnsafe(rri).match(
				(_) => { throw new Error('Expected error but got none') },
				(e) => {
					expect(msgFromError(e).length).toBeGreaterThan(0)
				}
			)
		})
	})
})
