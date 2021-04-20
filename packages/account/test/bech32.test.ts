import { Bech32, encbech32m } from '../src/bech32'

describe('bech32', () => {
	it('works', () => {
		const hrp = 'usdc_rr'
		const data = Buffer.from('4d6qejxtdg4y5r3zarvary0c5test', 'utf8')
		const bech32 = Bech32.encode({ hrp, data, encoding: encbech32m })._unsafeUnwrap()
		expect(bech32.toString()).toBe('usdc_rr14d6qejxtdg4y5r3zarvary0c5testxpjzsx')
	})
})