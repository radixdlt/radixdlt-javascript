describe('it needs tests', () => {
	it('needs test', () => {
		expect(1).toBe(1)
	})
})

// import { AccountT, NetworkT } from '@radixdlt/account'
//
// it('can change networkID', async (done) => {
// 	const wallet = createSpecificWallet()
//
// 	const n1 = NetworkT.MAINNET
// 	const n2 = NetworkT.BETANET
//
// 	const expectedValues = [n1, n2]
//
//
// 	wallet
// 		.observeActiveAccount()
// 		.pipe(
// 			map((a: AccountT) => a),
// 			take(2),
// 			toArray(),
// 		)
// 		.subscribe(
// 			(networks: NetworkT[]) => {
// 				expect(networks).toStrictEqual(expectedValues)
// 				done()
// 			},
// 			(error) => done(error),
// 		)
// })
