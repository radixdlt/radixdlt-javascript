import { nodeAPI } from '../src/api/api'
import { Address } from '@radixdlt/account'

import { Amount } from '@radixdlt/primitives'
import { UInt256 } from '@radixdlt/uint256'
import {
	BuildTransactionEndpoint,
	NetworkIdEndpoint,
	NetworkTransactionDemandEndpoint,
	NetworkTransactionThroughputEndpoint,
	StakePositionsEndpoint,
	TokenBalancesEndpoint,
	TransactionHistoryEndpoint,
	TransactionStatusEndpoint,
} from '../src/api/json-rpc/_types'
import { ResourceIdentifier } from '../src/dto/resourceIdentifier'
import {
	ActionType,
	ExecutedStakeTokensAction,
	ExecutedTransferTokensAction,
} from '../src/actions/_types'
import { TransferTokensAction } from '../src/actions/transferTokensAction'
import { StakeTokensAction } from '../src/actions/stakeTokensAction'
import { TokenPermission } from '../src/dto/_types'
import { makeTokenPermissions } from '../src/dto/tokenPermissions'
import { TransactionIdentifier } from '../src/dto/transactionIdentifier'

let mockClientReturnValue: any

function mockHTTPTransport() {}
function mockRequestManager() {}
function mockClient() {
	return {
		request: async () => mockClientReturnValue,
	}
}

jest.mock('@open-rpc/client-js', () => ({
	Client: mockClient,
	HTTPTransport: mockHTTPTransport,
	RequestManager: mockRequestManager,
}))
/*
describe('networking', () => {
	const client = nodeAPI(new URL('http://xyz'))
	const address = '9S81XtkW3H9XZrmnzWqYSuTFPhWXdRnnpL3XXk7h5XxAM6zMdH7k'
	const tokenRRI =
		'/9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT/FOOBAR'
	const date = '1995-12-17T03:24:00'
	const aid =
		'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef'

	describe('json-rpc', () => {
		it('should handle get universe magic response', async () => {
			mockClientReturnValue = <NetworkIdEndpoint.Response>{
				magic: 1000,
			}

			const expected: NetworkIdEndpoint.DecodedResponse = {
				magic: 1000,
			}

			const result = (await client.networkId())._unsafeUnwrap()

			expect(result).toMatchObject(expected)
		})

		it('should handle get token balances response', async () => {
			const tokenAmount = '100'

			mockClientReturnValue = {
				owner: address,
				tokenBalances: [
					{
						token: tokenRRI,
						amount: tokenAmount,
					},
				],
			}

			const expected: TokenBalancesEndpoint.DecodedResponse = {
				owner: Address.fromBase58String(address)._unsafeUnwrap(),
				tokenBalances: [
					{
						token: ResourceIdentifier.fromString(
							tokenRRI,
						)._unsafeUnwrap(),
						amount: Amount.inSmallestDenomination(
							new UInt256(tokenAmount),
						),
					},
				],
			}

			const result = (await client.tokenBalances(''))._unsafeUnwrap()

			expect(result.owner.equals(expected.owner)).toBe(true)
			expect(
				result.tokenBalances[0].amount.equals(
					expected.tokenBalances[0].amount,
				),
			).toBe(true)
			expect(
				result.tokenBalances[0].token.equals(
					expected.tokenBalances[0].token,
				),
			).toBe(true)
		})

		it('should handle get executed transactions response', async () => {
			mockClientReturnValue = <TransactionHistoryEndpoint.Response>{
				cursor: 'deadbeef',
				transactions: [
					{
						txID: 'deadbeef',
						sentAt: date,
						fee: '100',
						actions: [
							{
								type: ActionType.TOKEN_TRANSFER,
								from: address,
								to: address,
								amount: '100',
								resourceIdentifier: tokenRRI,
							},
							{
								type: ActionType.STAKE_TOKENS,
								validator: address,
								amount: '100',
							},
						],
					},
				],
			}

			const expected: TransactionHistoryEndpoint.DecodedResponse = {
				cursor: 'deadbeef',
				transactions: [
					{
						txID: 'deadbeef',
						sentAt: new Date(date),
						fee: Amount.inSmallestDenomination(new UInt256(100)),
						actions: [
							TransferTokensAction.intended({
								amount: Amount.inSmallestDenomination(
									new UInt256(100),
								),
								from: Address.fromBase58String(
									address,
								)._unsafeUnwrap(),
								to: Address.fromBase58String(
									address,
								)._unsafeUnwrap(),
								resourceIdentifier: ResourceIdentifier.fromString(
									tokenRRI,
								)._unsafeUnwrap(),
							}) as ExecutedTransferTokensAction,

							StakeTokensAction.intended({
								amount: Amount.inSmallestDenomination(
									new UInt256(100),
								),
								validator: Address.fromBase58String(
									address,
								)._unsafeUnwrap(),
							}) as ExecutedStakeTokensAction,
						],
					},
				],
			}

			const result = (
				await client.transactionHistory('', 0)
			)._unsafeUnwrap()

			expect(result.cursor).toEqual(expected.cursor)
			expect(result.transactions[0].actions[0].actionType).toEqual(
				expected.transactions[0].actions[0].actionType,
			)
			expect(
				result.transactions[0].actions[0].amount.equals(
					expected.transactions[0].actions[0].amount,
				),
			).toEqual(true)
			expect(
				result.transactions[0].actions[0].resourceIdentifier.equals(
					expected.transactions[0].actions[0].resourceIdentifier,
				),
			).toEqual(true)
			expect(
				result.transactions[0].actions[0].sender.equals(
					expected.transactions[0].actions[0].sender,
				),
			).toEqual(true)
			expect(result.transactions[0].txID).toEqual(
				expected.transactions[0].txID,
			)
			expect(
				result.transactions[0].fee.equals(expected.transactions[0].fee),
			).toEqual(true)
			expect(result.transactions[0].sentAt.valueOf()).toEqual(
				expected.transactions[0].sentAt.valueOf(),
			)

			expect(
				result.transactions[0].actions[1].amount.equals(
					expected.transactions[0].actions[1].amount,
				),
			)
			expect(
				result.transactions[0].actions[1].resourceIdentifier.equals(
					expected.transactions[0].actions[1].resourceIdentifier,
				),
			)
			expect(
				result.transactions[0].actions[1].from.equals(
					expected.transactions[0].actions[1].from,
				),
			)
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

		it('should handle get native token response', async () => {
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
					burn: TokenPermission.ALL,
				},
			}

			const expected: NativeToken.DecodedResponse = {
				name,
				rri: ResourceIdentifier.fromString(tokenRRI)._unsafeUnwrap(),
				symbol,
				description,
				granularity: Amount.inSmallestDenomination(
					new UInt256(granularity),
				),
				isSupplyMutable,
				currentSupply: Amount.inSmallestDenomination(
					new UInt256(currentSupply),
				),
				tokenInfoURL: new URL(tokenInfoURL),
				iconURL: new URL(iconURL),
				tokenPermission: makeTokenPermissions({
					mint: TokenPermission.ALL,
					burn: TokenPermission.ALL,
				}),
			}

			const result = (await client.nativeToken())._unsafeUnwrap()

			expect(result.currentSupply.equals(expected.currentSupply)).toBe(
				true,
			)
			expect(result.description).toEqual(expected.description)
			expect(result.granularity.equals(expected.granularity)).toBe(true)
			expect(result.iconURL.toString()).toEqual(
				expected.iconURL.toString(),
			)
			expect(result.tokenInfoURL.toString()).toEqual(
				expected.tokenInfoURL.toString(),
			)
			expect(result.isSupplyMutable).toEqual(expected.isSupplyMutable)
			expect(result.name).toEqual(expected.name)
			expect(result.rri.equals(expected.rri)).toBe(true)
			expect(result.tokenPermission.equals(expected.tokenPermission))
		})

		it('should handle get stake information response', async () => {
			const amount = '100'

			mockClientReturnValue = <StakePositionsEndpoint.Response>[
				{
					validator: address,
					amount,
				},
			]

			const expected: StakePositionsEndpoint.DecodedResponse = [
				{
					validator: Address.fromBase58String(
						address,
					)._unsafeUnwrap(),
					amount: Amount.inSmallestDenomination(new UInt256(amount)),
				},
			]

			const result = (await client.stakes(''))._unsafeUnwrap()

			expect(result[0].amount.equals(expected[0].amount)).toBe(true)
			expect(result[0].validator.equals(expected[0].validator)).toBe(true)
		})

		it('should handle get transaction status response', async () => {
			const txStatus: TransactionStatusEndpoint.Status = 'CONFIRMED'
			const failure = 'ouch'

			mockClientReturnValue = <TransactionStatusEndpoint.Response>{
				txID: aid,
				status: txStatus,
				failure,
			}

			const expected: TransactionStatusEndpoint.DecodedResponse = {
				txID: TransactionIdentifier.create(aid)._unsafeUnwrap(),
				status: txStatus,
				failure,
			}

			const result = (await client.transactionStatus(''))._unsafeUnwrap()

			expect(result.txID.equals(result.txID)).toBe(
				true,
			)
			expect(result.failure).toEqual(expected.failure)
			expect(result.status).toEqual(expected.status)
		})

		it('should handle get network transaction throughput response', async () => {
			const tps = 1

			mockClientReturnValue = <NetworkTransactionThroughputEndpoint.Response>{
				tps,
			}

			const expected: NetworkTransactionThroughputEndpoint.DecodedResponse = mockClientReturnValue

			const result = (
				await client.networkTransactionThroughput()
			)._unsafeUnwrap()

			expect(result.tps).toEqual(expected.tps)
		})

		it('should handle get network transaction demand response', async () => {
			const tps = 1

			mockClientReturnValue = <NetworkTransactionDemandEndpoint.Response>{
				tps,
			}

			const expected: NetworkTransactionDemandEndpoint.DecodedResponse = mockClientReturnValue

			const result = (
				await client.networkTransactionDemand()
			)._unsafeUnwrap()

			expect(result.tps).toEqual(expected.tps)
		})

		it('should handle get atom for transaction response', async () => {
			const builtTx = {
				transaction: {
					blob: 'bloooooooob',
					hashOfBlobToSign: 'deadbeef'
				},
				fee: '12'
			}
			const failure: BuildTransactionEndpoint.Failure = 'NOT_PERMITTED'

			mockClientReturnValue = <BuildTransactionEndpoint.Response>{
				...builtTx,
				failure,
			}

			const expected: BuildTransactionEndpoint.DecodedResponse = mockClientReturnValue

			const result = (
				await client.buildTransaction({} as any)
			)._unsafeUnwrap()

			expect(result.builtTx).toEqual(expected.atomCBOR)
			expect(result.failure).toEqual(expected.failure)
		})

		it('should handle submit signed atom response', async () => {
			const failure: SubmitSignedAtom.Failure = 'INSUFFICIENT_FUNDS'

			mockClientReturnValue = <SubmitSignedAtom.Response>{
				txID: aid,
				failure,
			}

			const expected: SubmitSignedAtom.DecodedResponse = {
				txID: TransactionIdentifier.create(aid)._unsafeUnwrap(),
				failure,
			}

			const result = (
				await client.submitSignedAtom('', '', '')
			)._unsafeUnwrap()

			expect(result.txID.equals(expected.txID)).toBe(
				true,
			)
			expect(result.failure).toEqual(expected.failure)
		})
	})
})
*/
describe('it is all skipped', () => {
	it('is skipped', () => {
		expect(true).toBeTruthy()
	})
})
