
import { ExecutedTransactions, NativeToken, TokenBalances, UniverseMagic } from '../src/api/json-rpc/_types'
import { nodeAPI } from '../src/api/api'
import { Address } from '@radixdlt/account'
import { makeTokenPermissions, ResourceIdentifier, TokenPermission } from '@radixdlt/atom'
import { Amount } from '@radixdlt/primitives'
import { UInt256 } from '@radixdlt/uint256'
import { BurnTokensAction, TransferTokensAction, UserActionType } from '@radixdlt/actions'

let mockClientReturnValue: any

function mockHTTPTransport() { }
function mockRequestManager() { }
function mockClient() {
	return {
		request: async () => mockClientReturnValue
	}
}

jest.mock("@open-rpc/client-js", () => ({
	Client: mockClient,
	HTTPTransport: mockHTTPTransport,
	RequestManager: mockRequestManager
}))

describe('networking', () => {
	const client = nodeAPI(new URL('http://xyz'))
	const address = '9S81XtkW3H9XZrmnzWqYSuTFPhWXdRnnpL3XXk7h5XxAM6zMdH7k'
	const tokenRRI = '/9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT/FOOBAR'
	const date = '1995-12-17T03:24:00'

	describe('json-rpc', () => {
		it('should be able to get universe magic', async () => {
			mockClientReturnValue = <UniverseMagic.Response>{
				magic: 1000
			}

			const expected: UniverseMagic.DecodedResponse = {
				magic: 1000
			}

			const result = (await client.universeMagic())._unsafeUnwrap()

			expect(result).toMatchObject(expected)
		})

		it('should be able to get token balances', async () => {
			const tokenAmount = '100'

			mockClientReturnValue = {
				owner: address,
				tokenBalances: [{
					token: tokenRRI,
					amount: tokenAmount
				}]
			}

			const expected: TokenBalances.DecodedResponse = {
				owner: Address.fromBase58String(address)._unsafeUnwrap(),
				tokenBalances: [
					{
						token: ResourceIdentifier.fromString(tokenRRI)._unsafeUnwrap(),
						amount: Amount.inSmallestDenomination(new UInt256(tokenAmount))
					}
				]
			}

			const result = (await client.tokenBalances(''))._unsafeUnwrap()

			expect(result.owner.equals(expected.owner)).toBe(true)
			expect(result.tokenBalances[0].amount.equals(expected.tokenBalances[0].amount)).toBe(true)
			expect(result.tokenBalances[0].token.equals(expected.tokenBalances[0].token)).toBe(true)
		})

		it('should be able to get executed transactions', async () => {
			mockClientReturnValue = <ExecutedTransactions.Response>{
				cursor: 'deadbeef',
				transactions: [
					{
						atomId: 'deadbeef',
						sentAt: date,
						fee: '100',
						actions: [
							{
								type: UserActionType.TOKEN_TRANSFER,
								from: address,
								to: address,
								amount: '100',
								resourceIdentifier: tokenRRI
							},
							{
								type: UserActionType.BURN_TOKENS,
								burner: address,
								amount: '100',
								resourceIdentifier: tokenRRI
							}
						]
					}
				]
			}

			const expected: ExecutedTransactions.DecodedResponse = {
				cursor: 'deadbeef',
				transactions: [
					{
						atomId: 'deadbeef',
						sentAt: new Date(date),
						fee: Amount.inSmallestDenomination(new UInt256(100)),
						actions: [
							TransferTokensAction.create({
								amount: Amount.inSmallestDenomination(new UInt256(100)),
								from: Address.fromBase58String(address)._unsafeUnwrap(),
								to: Address.fromBase58String(address)._unsafeUnwrap(),
								resourceIdentifier: ResourceIdentifier.fromString(tokenRRI)._unsafeUnwrap()
							}),

							BurnTokensAction.create({
								amount: Amount.inSmallestDenomination(new UInt256(100)),
								resourceIdentifier: ResourceIdentifier.fromString(tokenRRI)._unsafeUnwrap(),
								burner: Address.fromBase58String(address)._unsafeUnwrap(),
							})
						]
					}
				]
			}

			const result = (await client.executedTransactions('', 0))._unsafeUnwrap()

			expect(result.cursor).toEqual(expected.cursor)
			expect(result.transactions[0].actions[0].actionType).toEqual(expected.transactions[0].actions[0].actionType)
			expect(
				result.transactions[0].actions[0].amount.equals(
					expected.transactions[0].actions[0].amount
				)
			).toEqual(true)
			expect(
				result.transactions[0].actions[0].resourceIdentifier.equals(
					expected.transactions[0].actions[0].resourceIdentifier
				)
			).toEqual(true)
			expect(
				result.transactions[0].actions[0].sender.equals(
					expected.transactions[0].actions[0].sender
				)
			).toEqual(true)
			expect(result.transactions[0].atomId).toEqual(expected.transactions[0].atomId)
			expect(result.transactions[0].fee.equals(
				expected.transactions[0].fee
			)).toEqual(true)
			expect(result.transactions[0].sentAt.valueOf()).toEqual(expected.transactions[0].sentAt.valueOf())

			expect(result.transactions[0].actions[1].amount.equals(
				expected.transactions[0].actions[1].amount
			))
			expect(result.transactions[0].actions[1].resourceIdentifier.equals(
				expected.transactions[0].actions[1].resourceIdentifier
			))
			expect(result.transactions[0].actions[1].sender.equals(
				expected.transactions[0].actions[1].sender
			))
		})

		const name = 'Radix'
		const rri = tokenRRI
		const symbol = 'XRD'
		const description = 'Cool token'
		const granularity = '1'
		const isSupplyMutable = false
		const currentSupply = '100'
		const tokenInfoURL = 'http://info.com'
		const iconURL = 'http://icon.com'

		it('should be able to get native token', async () => {
			mockClientReturnValue = <NativeToken.Response>{
				name,
				rri,
				symbol,
				description,
				granularity,
				isSupplyMutable,
				currentSupply,
				tokenInfoURL,
				iconURL,
				tokenPermission: {
					mint: TokenPermission.ALL,
					burn: TokenPermission.ALL
				}
			}

			const expected: NativeToken.DecodedResponse = {
				name,
				rri: ResourceIdentifier.fromString(tokenRRI)._unsafeUnwrap(),
				symbol,
				description,
				granularity: Amount.inSmallestDenomination(new UInt256(granularity)),
				isSupplyMutable,
				currentSupply: Amount.inSmallestDenomination(new UInt256(currentSupply)),
				tokenInfoURL: new URL(tokenInfoURL),
				iconURL: new URL(iconURL),
				tokenPermission: makeTokenPermissions({
					mint: TokenPermission.ALL,
					burn: TokenPermission.ALL
				})
			}

			const result = (await client.nativeToken())._unsafeUnwrap()

			expect(result.currentSupply.equals(expected.currentSupply)).toBe(true)
			expect(result.description).toEqual(expected.description)
			expect(result.granularity.equals(expected.granularity)).toBe(true)
			expect(result.iconURL.toString()).toEqual(expected.iconURL.toString())
			expect(result.tokenInfoURL.toString()).toEqual(expected.tokenInfoURL.toString())
			expect(result.isSupplyMutable).toEqual(expected.isSupplyMutable)
			expect(result.name).toEqual(expected.name)
			expect(result.rri.equals(expected.rri)).toBe(true)
			expect(result.tokenPermission.equals(expected.tokenPermission))
		})
	})
})











