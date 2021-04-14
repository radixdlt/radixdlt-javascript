import { nodeAPI } from '../src/api/api'
import {
	BuildTransactionEndpoint,
	NativeTokenEndpoint,
	NetworkIdEndpoint,
	NetworkTransactionDemandEndpoint,
	NetworkTransactionThroughputEndpoint,
	StakePositionsEndpoint,
	SubmitSignedTransactionEndpoint,
	TokenBalancesEndpoint,
	TransactionHistoryEndpoint,
	TransactionStatusEndpoint,
} from '../src/api/json-rpc/_types'
import { ResourceIdentifier } from '../src/dto/resourceIdentifier'
import { Amount } from '@radixdlt/primitives'
import { UInt256 } from '@radixdlt/uint256'
import { TransactionIdentifier } from '../src/dto/transactionIdentifier'
import {
	ActionType,
	ExecutedStakeTokensAction,
	ExecutedTransferTokensAction,
} from '../src/actions/_types'
import {
	ExecutedTransaction,
	TokenPermission,
	TransactionStatus,
} from '../src/dto/_types'
import { makeTokenPermissions } from '../src/dto/tokenPermissions'
import { Radix } from '../src/radix'
import { radixCoreAPI } from '../src/api/radixCoreAPI'
import { of } from '@radixdlt/account/node_modules/rxjs'
import { APIError, APIErrorCause, ErrorCategory } from '../src/errors'
import { alice, bob } from '../src/mockRadix'
import { PublicKey, Signature } from '@radixdlt/crypto'
import { Subscription } from 'rxjs'
import { signatureFromHexStrings } from '../../crypto/test/ellipticCurveCryptography.test'

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

describe('networking', () => {
	const client = nodeAPI(new URL('http://xyz'))
	const tokenRRI =
		'/9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT/FOOBAR'
	const date = '1995-12-17T03:24:00'
	const txID =
		'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef'

	describe('json-rpc', () => {
		it('should handle get universe magic response', async () => {
			mockClientReturnValue = <NetworkIdEndpoint.Response>{
				networkId: 237,
			}

			const expected: NetworkIdEndpoint.DecodedResponse = {
				networkId: { byte: 237 },
			}

			const result = (await client.networkId())._unsafeUnwrap()

			expect(result).toMatchObject(expected)
		})

		it('should handle get token balances response', async () => {
			const tokenAmount = '100'

			mockClientReturnValue = {
				owner: alice.toString(),
				tokenBalances: [
					{
						token: tokenRRI,
						amount: tokenAmount,
					},
				],
			}

			const expected: TokenBalancesEndpoint.DecodedResponse = {
				owner: alice,
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
				cursor:
					'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
				transactions: [
					{
						txID:
							'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
						sentAt: date,
						fee: '100',
						actions: [
							{
								type: ActionType.TOKEN_TRANSFER.valueOf(),
								from: alice.toString(),
								to: bob.toString(),
								amount: '100',
								rri: tokenRRI,
							},
							{
								type: ActionType.STAKE_TOKENS,
								validator: bob.toString(),
								amount: '100',
							},
						],
					},
				],
			}

			const expectedTx0A0: ExecutedTransferTokensAction = {
				type: ActionType.TOKEN_TRANSFER,
				amount: Amount.inSmallestDenomination(new UInt256(100)),
				from: alice,
				to: bob,
				rri: ResourceIdentifier.fromString(tokenRRI)._unsafeUnwrap(),
			}

			const expectedTx0A1: ExecutedStakeTokensAction = {
				type: ActionType.STAKE_TOKENS,
				amount: Amount.inSmallestDenomination(new UInt256(100)),
				validator: bob,
			}

			const expectedTx0: ExecutedTransaction = {
				txID: TransactionIdentifier.create(txID)._unsafeUnwrap(),
				sentAt: new Date(date),
				fee: Amount.inSmallestDenomination(UInt256.valueOf(100)),
				actions: [expectedTx0A0, expectedTx0A1],
			}

			const expected: TransactionHistoryEndpoint.DecodedResponse = {
				cursor:
					'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
				transactions: [expectedTx0],
			}

			const result = (
				await client.transactionHistory(alice.toString(), 0)
			)._unsafeUnwrap()

			expect(result.cursor).toEqual(expected.cursor)
			const tx0 = result.transactions[0] as ExecutedTransaction

			expect(tx0.actions.length).toBe(expectedTx0.actions.length)

			const tx0A0 = tx0.actions[0] as ExecutedTransferTokensAction
			expect(tx0A0.type).toEqual(ActionType.TOKEN_TRANSFER)
			expect(tx0A0.type).toEqual(expectedTx0A0.type)
			expect(tx0A0.amount.equals(expectedTx0A0.amount)).toEqual(true)

			expect(tx0A0.rri.equals(expectedTx0A0.rri)).toEqual(true)

			expect(tx0A0.from.equals(expectedTx0A0.from)).toEqual(true)

			expect(tx0.txID.equals(expectedTx0.txID)).toBe(true)

			expect(tx0.fee.equals(expectedTx0.fee)).toEqual(true)

			expect(tx0.sentAt.valueOf()).toBe(expectedTx0.sentAt.valueOf())

			const tx0A1 = tx0.actions[1] as ExecutedStakeTokensAction
			expect(tx0A1.type).toEqual(ActionType.STAKE_TOKENS)
			expect(tx0A1.type).toEqual(expectedTx0A1.type)
			expect(tx0A1.amount.equals(expectedTx0A1.amount)).toEqual(true)

			expect(tx0A1.validator.equals(expectedTx0A1.validator)).toEqual(
				true,
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
			mockClientReturnValue = <NativeTokenEndpoint.Response>{
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

			const expected: NativeTokenEndpoint.DecodedResponse = {
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
					validator: bob.toString(),
					amount,
				},
			]

			const expected: StakePositionsEndpoint.DecodedResponse = [
				{
					validator: bob,
					amount: Amount.inSmallestDenomination(new UInt256(amount)),
				},
			]

			const result = (await client.stakes(''))._unsafeUnwrap()

			expect(result[0].amount.equals(expected[0].amount)).toBe(true)
			expect(result[0].validator.equals(expected[0].validator)).toBe(true)
		})

		it('should handle get transaction status response', async () => {
			const txStatus = TransactionStatus.CONFIRMED

			const txID_ = TransactionIdentifier.create(txID)._unsafeUnwrap()

			mockClientReturnValue = <TransactionStatusEndpoint.Response>{
				txID: txID_.toString(),
				status: txStatus,
			}

			const expected: TransactionStatusEndpoint.DecodedResponse = {
				txID: txID_,
				status: txStatus,
			}

			const result = (
				await client.transactionStatus(txID_.toString())
			)._unsafeUnwrap()

			expect(result.txID.equals(result.txID)).toBe(true)
			expect(result.status).toEqual(expected.status)
		})

		it('should handle get network transaction throughput response', async () => {
			const tps = 1

			mockClientReturnValue = <
				NetworkTransactionThroughputEndpoint.Response
			>{
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
					hashOfBlobToSign: 'deadbeef',
				},
				fee: '12',
			}

			mockClientReturnValue = <BuildTransactionEndpoint.Response>{
				...builtTx,
			}

			const expected: BuildTransactionEndpoint.DecodedResponse = mockClientReturnValue

			const result = (
				await client.buildTransaction({} as any)
			)._unsafeUnwrap()

			expect(result).toStrictEqual(expected)
		})

		it('should handle submit signed atom response', async () => {
			const txID_ = TransactionIdentifier.create(txID)._unsafeUnwrap()

			const transaction = {
				blob: 'bloooooooob',
				hashOfBlobToSign: 'deadbeef',
			}

			mockClientReturnValue = <SubmitSignedTransactionEndpoint.Response>{
				txID: txID_.toString(),
				transaction,
				publicKeyOfSigner: '',
				signature: '',
			}

			const expected: SubmitSignedTransactionEndpoint.DecodedResponse = {
				txID: txID_,
				transaction,
				publicKeyOfSigner: <PublicKey>{},
				signature: <Signature>{},
			}

			const result = (
				await client.submitSignedTransaction({ blob: '' }, '', '')
			)._unsafeUnwrap()

			//@ts-ignore
			expect(result.txID.equals(expected.txID)).toBe(true)
		})

		it('should handle a build transaction failure', (done) => {
			const subs = new Subscription()

			const mockedErrorMsg = 'MOCKED_FAILURE_OF_BUILD_TX'
			mockClientReturnValue = <BuildTransactionEndpoint.Response>{
				failure: mockedErrorMsg,
			}

			const radix = Radix.create()
				.__withAPI(
					of(
						radixCoreAPI(
							{ url: new URL('https://radix.com') },
							client,
						),
					),
				)
				.logLevel('silent')

			radix.ledger
				.buildTransaction({} as any)
				.subscribe(
					(_ux) => {
						done(
							new Error(
								'Call to buildTransaction succeeded, but we expected it to fail.',
							),
						)
					},
					(error: APIError) => {
						expect(error.errors.length).toBe(1)
						expect(error.category).toEqual(ErrorCategory.API)
						expect(error.cause).toEqual(
							APIErrorCause.BUILD_TRANSACTION_FAILED,
						)
						expect(error.errors[0].message).toBe(mockedErrorMsg)
						done()
					},
				)
				.add(subs)
		})

		it('should handle submit signed tx with error message', (done) => {
			const subs = new Subscription()

			const mockedErrorMsg = 'MOCKED_FAILURE_OF_SUBMIT_TX'
			mockClientReturnValue = <SubmitSignedTransactionEndpoint.Response>{
				failure: mockedErrorMsg,
			}

			const radix = Radix.create()
				.__withAPI(
					of(
						radixCoreAPI(
							{ url: new URL('https://radix.com') },
							client,
						),
					),
				)
				.logLevel('silent')

			radix.ledger
				.submitSignedTransaction({
					publicKeyOfSigner: alice.publicKey,
					transaction: {
						blob: 'xyz',
						hashOfBlobToSign: 'deadbeef',
					},
					signature: signatureFromHexStrings({
						r:
							'934b1ea10a4b3c1757e2b0c017d0b6143ce3c9a7e6a4a49860d7a6ab210ee3d8',
						s:
							'2442ce9d2b916064108014783e923ec36b49743e2ffa1c4496f01a512aafd9e5',
					}),
				})
				.subscribe(
					(_ux) => {
						done(
							new Error(
								'Call to buildTransaction succeeded, but we expected it to fail.',
							),
						)
					},
					(error: APIError) => {
						expect(error.errors.length).toBe(1)

						expect(error.category).toEqual(ErrorCategory.API)
						expect(error.cause).toEqual(
							APIErrorCause.SUBMIT_SIGNED_TX_FAILED,
						)
						expect(error.errors[0].message).toBe(mockedErrorMsg)
						done()
					},
				)
				.add(subs)
		})
	})
})
