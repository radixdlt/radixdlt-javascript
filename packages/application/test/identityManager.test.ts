import { NetworkT } from '@radixdlt/account'
import { createIM } from './util'
import { IdentityT } from '../src'
import { map, take, toArray } from 'rxjs/operators'

describe('identityManager', () => {
	it('can observeActiveIdentity', (done) => {
		const identityManager = createIM()

		const expectedValues = [0, 1, 2]

		identityManager
			.observeActiveIdentity()
			.pipe(
				map((i) => i.hdPath.addressIndex.value()),
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

		identityManager.deriveNextIdentity({ alsoSwitchTo: true })
		identityManager.deriveNextIdentity({ alsoSwitchTo: true })
	})
})
