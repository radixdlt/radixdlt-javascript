import { createWallet } from './util'
import { map, take, toArray } from 'rxjs/operators'
import { Subscription } from 'rxjs'

describe('wallet', () => {
	it('can observeActiveIdentity', (done) => {
		const subs = new Subscription()
		const wallet = createWallet()

		const expectedValues = [0, 1, 2]

		subs.add(
			wallet
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
			wallet
				.deriveNextLocalHDIdentity({ alsoSwitchTo: true })
				.subscribe((_) => {
					subs.add(
						wallet
							.deriveNextLocalHDIdentity({ alsoSwitchTo: true })
							.subscribe(),
					)
				}),
		)
	})
})
