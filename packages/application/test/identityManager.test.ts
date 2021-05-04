import { createIM } from './util'
import { map, take, toArray } from 'rxjs/operators'
import { Subscription } from 'rxjs'

describe('identityManager', () => {
	it('can observeActiveIdentity', (done) => {
		const subs = new Subscription()
		const identityManager = createIM()

		const expectedValues = [0, 1, 2]

		subs.add(
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
				),
		)

		subs.add(
			identityManager
				.deriveNextLocalHDIdentity({ alsoSwitchTo: true })
				.subscribe((_) => {
					subs.add(
						identityManager
							.deriveNextLocalHDIdentity({ alsoSwitchTo: true })
							.subscribe(),
					)
				}),
		)
	})
})
