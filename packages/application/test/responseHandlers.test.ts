import {
	transformMessage,
	handleAccountBalancesResponse,
} from '../src/api/open-api/responseHandlers'

/* eslint-disable */
describe('transformMessage', () => {
	it.each([
		['00006b656b', 'kek'],
		[
			'01ff02b4b098bcbf29997fc26e8377ef70a39077178e34a0bf67c8540ee6e69aff36627245c6e3a88e23b2796ec2d045906c30cf23092e38e118dfdd51cfb265db5c',
			'01ff02b4b098bcbf29997fc26e8377ef70a39077178e34a0bf67c8540ee6e69aff36627245c6e3a88e23b2796ec2d045906c30cf23092e38e118dfdd51cfb265db5c',
		],
		['303030303734363537333734', 'test'],
		['303030303638363932303734363537333734363936653637', 'hi testing'],
		[
			'303030303431366536663734363836313230366636653635323837343635373337343239',
			'Anotha one(test)',
		],
		[null, undefined],
		['312132123312', '<Failed to interpret message>'],
		[
			'303166663032656130303866376531393037643237666465663237376564313439623535323065626539643039336265363765303138663534633136633430666236663939353735383434343566343866346538623535356330393539343137663539356465333032663862633639313764363263623363346538623734386539323834636332316563303632386537303061356664616463663030323135303238373935303639656335653436',
			'01ff02ea008f7e1907d27fdef277ed149b5520ebe9d093be67e018f54c16c40fb6f9957584445f48f4e8b555c0959417f595de302f8bc6917d62cb3c4e8b748e9284cc21ec0628e700a5fdadcf00215028795069ec5e46',
		],
	])('transforms "%s" into "%s"', (input, expected) => {
		// @ts-ignore
		expect(transformMessage(input)).toBe(expected)
	})
})

const fixtures = [
	{
		data: {
			ledger_state: {
				version: 42905709,
				timestamp: '2022-01-06T07:36:32.638Z',
				epoch: 4405,
				round: 9787,
			},
			account_balances: {
				staked_and_unstaking_balance: {
					value: '593224304698885819581',
					token_identifier: {
						rri: 'xrd_tr1qyf0x76s',
					},
				},
				liquid_balances: [
					{
						value: '100000000000000000000000',
						token_identifier: {
							rri: 'fire_tr1qvs4gje6qfxmu5wfn9jd5x9ku20ds7fcucn6tzcnyxwq7n02zx',
						},
					},
					{
						value: '99999894000000100000000',
						token_identifier: {
							rri: 'buzzsaw_tr1q0aymplntjgcdsc5fuxcgq9me47yu26qf929cqexduxs7c299n',
						},
					},
					{
						value: '99971993105302200000000',
						token_identifier: {
							rri: 'captainfr33domst0000000000000ken_tr1q09jf8c05v3lfj3tqc04x7nlp0sag8yq5k6qpaexxnrs004s7q',
						},
					},
					{
						value: '909699413989940263553',
						token_identifier: {
							rri: 'xrd_tr1qyf0x76s',
						},
					},
					{
						value: '5999999999999999999',
						token_identifier: {
							rri: 'sptve_tr1qvddj7vg004cstsqvu6nar0ssr4x8v2r7rnry2e66n7q0nmaus',
						},
					},
				],
			},
		},
	} as any,
]

describe('handleAccountBalancesResponse', () => {
	it('should correctly transform balances', () => {
		const actual = handleAccountBalancesResponse(
			fixtures[0],
		)._unsafeUnwrap()

		const expectedLiquidBalances =
			fixtures[0].data.account_balances.liquid_balances

		const actualLiquidBalances =
			actual.account_balances.liquid_balances.map(item => ({
				value: item.value.toString(),
				token_identifier: { rri: item.token_identifier.rri.toString() },
			}))

		const expectedStakedBalance =
			fixtures[0].data.account_balances.staked_and_unstaking_balance

		const actualStakedBalance = {
			value: actual.account_balances.staked_and_unstaking_balance.value.toString(),
			token_identifier: {
				rri: actual.account_balances.staked_and_unstaking_balance.token_identifier.rri.toString(),
			},
		}

		const liquidXrdValue = actual.account_balances.liquid_balances.find(
			item => item.token_identifier.rri.toString() === 'xrd_tr1qyf0x76s',
		)?.value
		const stakedXrdValue =
			actual.account_balances.staked_and_unstaking_balance.value

		expect(actualLiquidBalances).toEqual(expectedLiquidBalances)
		expect(actualStakedBalance).toEqual(expectedStakedBalance)
		expect('1502923718688826083134').toEqual(
			liquidXrdValue?.add(stakedXrdValue).toString(),
		)
	})
})
