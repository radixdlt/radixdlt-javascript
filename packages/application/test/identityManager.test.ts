import { createIM } from './util'
import { map, take, toArray } from 'rxjs/operators'

describe('identityManager', () => {
	it('can observeActiveIdentity', (done) => {
		const identityManager = createIM()

		const expectedValues = [0, 1, 2]

		identityManager
			.observeActiveIdentity()
			.pipe(
				map((i) => i.hdPath!.addressIndex.value()),
				take(expectedValues.length),
				toArray(),
			)
			.subscribe(
				(values) => {
					expect(values).toStrictEqual(expectedValues)
					done()
				},
				(error) => done(error),
			)

		identityManager.deriveNextLocalHDIdentity({ alsoSwitchTo: true })
		identityManager.deriveNextLocalHDIdentity({ alsoSwitchTo: true })
	})
})
