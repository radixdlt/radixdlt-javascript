import { Subscription } from 'rxjs'
import { AccountAddress, NetworkT } from '@radixdlt/account'
import { Radix } from '../src'
import { msgFromError } from '@radixdlt/util'
import {
	stringifySimpleTokenBalances,
	stringifySimpleTXHistory,
} from './stringifyTypes'

describe.skip('debugPrintRadixData', () => {
	const radix = Radix.create({ network: NetworkT.BETANET }).connect(
		'https://18.168.73.103/rpc',
	)

	const address = AccountAddress.fromUnsafe(
		'brx1qsp0we5yamtxqv5f2g94fml2z47j6n5kepd552dx980hs8y042ry5yq64vy06',
	)._unsafeUnwrap()

	it('txHistorydate', done => {
		const subs = new Subscription()

		subs.add(
			radix.ledger
				.transactionHistory({ address: address, size: 5 })
				.subscribe(
					history => {
						console.log(
							`🔮 history.tx: ${stringifySimpleTXHistory(
								history,
							)}`,
						)
						done()
					},
					error => {
						done(
							new Error(
								`Failed to get tx: ${msgFromError(error)}`,
							),
						)
					},
				),
		)
	})

	it('tokenBalances', done => {
		const subs = new Subscription()

		subs.add(
			radix.ledger.tokenBalancesForAddress(address).subscribe(tbs => {
				console.log(
					`🔮 tokenBalances:\n${stringifySimpleTokenBalances(tbs)}`,
				)
				done()
			}),
		)
	})
})
