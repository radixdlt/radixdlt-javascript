import { nodeAPI } from '../src/api/api'
import {
	BuildTransactionEndpoint,
	LookupTransactionEndpoint,
	NativeTokenEndpoint,
	NetworkIdEndpoint,
	NetworkTransactionDemandEndpoint,
	NetworkTransactionThroughputEndpoint,
	StakePositionsEndpoint,
	SubmitSignedTransactionEndpoint,
	TokenBalancesEndpoint,
	TokenInfoEndpoint,
	TransactionHistoryEndpoint,
	TransactionStatusEndpoint,
	UnstakePositionsEndpoint
} from '../src/api/json-rpc/_types'
import { ResourceIdentifier } from '../src/dto/resourceIdentifier'
import { Amount, magicFromNumber } from '@radixdlt/primitives'
import { UInt256 } from '@radixdlt/uint256'
import { TransactionIdentifier } from '../src/dto/transactionIdentifier'
import {
	ActionType,
	ExecutedOtherAction,
	ExecutedStakeTokensAction,
	ExecutedTransferTokensAction,
	ExecutedUnstakeTokensAction,
} from '../src/actions/_types'
import {
	ExecutedTransaction,
	RawTransferAction,
	TokenPermission,
	TransactionStatus,
	UnstakePosition,
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
import { isArray, isObject, LogLevel } from '@radixdlt/util'
import { MethodObject, OpenrpcDocument, ContentDescriptorObject } from '@open-rpc/meta-schema'
import { Address } from '@radixdlt/account'
const faker = require("json-schema-faker")

let mockClientReturnValue: any

function mockHTTPTransport() { }
function mockRequestManager() { }
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

// @ts-ignore
const rpcSpec: OpenrpcDocument = process['rpcSpec']

const expectedDecodedResponses = {
	[rpcSpec.methods[0].name]: (response: NetworkIdEndpoint.Response): NetworkIdEndpoint.DecodedResponse => ({
		networkId: magicFromNumber(response.networkId),
	}),

	[rpcSpec.methods[1].name]: (response: NativeTokenEndpoint.Response): NativeTokenEndpoint.DecodedResponse => ({
		name: response.name,
		rri: ResourceIdentifier.fromString(response.rri)._unsafeUnwrap(),
		symbol: response.symbol,
		description: response.description,
		granularity: Amount.inSmallestDenomination(
			new UInt256(response.granularity),
		),
		isSupplyMutable: response.isSupplyMutable,
		currentSupply: Amount.inSmallestDenomination(
			new UInt256(response.currentSupply),
		),
		tokenInfoURL: new URL(response.tokenInfoURL),
		iconURL: new URL(response.iconURL),
		tokenPermission: makeTokenPermissions(response.tokenPermission)
	}),

	[rpcSpec.methods[2].name]: (response: TokenInfoEndpoint.Response): TokenInfoEndpoint.DecodedResponse => ({
		name: response.name,
		rri: ResourceIdentifier.fromString(response.rri)._unsafeUnwrap(),
		symbol: response.symbol,
		description: response.description,
		granularity: Amount.inSmallestDenomination(
			new UInt256(response.granularity),
		),
		isSupplyMutable: response.isSupplyMutable,
		currentSupply: Amount.inSmallestDenomination(
			new UInt256(response.currentSupply),
		),
		tokenInfoURL: new URL(response.tokenInfoURL),
		iconURL: new URL(response.iconURL),
		tokenPermission: makeTokenPermissions(response.tokenPermission)
	}),

	[rpcSpec.methods[3].name]: (response: TokenBalancesEndpoint.Response): TokenBalancesEndpoint.DecodedResponse => ({
		owner: alice,
		tokenBalances: [
			{
				token: ResourceIdentifier.fromString(
					response.tokenBalances[0].rri,
				)._unsafeUnwrap(),
				amount: Amount.inSmallestDenomination(
					new UInt256(response.tokenBalances[0].amount),
				),
			},
		],
	}),

	[rpcSpec.methods[4].name]: (response: TransactionHistoryEndpoint.Response): TransactionHistoryEndpoint.DecodedResponse => ({
		cursor: response.cursor,
		transactions: [
			{
				txID: TransactionIdentifier.create(response.transactions[0].txID)._unsafeUnwrap(),
				sentAt: new Date(response.transactions[0].sentAt),
				fee: Amount.fromUnsafe(response.transactions[0].fee)._unsafeUnwrap(),
				message: response.transactions[0].message,
				actions: response.transactions[0].actions.map(action =>
					action.type === ActionType.TOKEN_TRANSFER
						? <ExecutedTransferTokensAction>{
							from: Address.fromUnsafe(action.from)._unsafeUnwrap(),
							to: Address.fromUnsafe(action.to)._unsafeUnwrap(),
							rri: ResourceIdentifier.fromUnsafe(action.rri)._unsafeUnwrap(),
							amount: Amount.fromUnsafe(action.amount)._unsafeUnwrap(),
						}
						: action.type === ActionType.STAKE_TOKENS || action.type === ActionType.UNSTAKE_TOKENS
							? <ExecutedStakeTokensAction>{
								from: Address.fromUnsafe(action.validator)._unsafeUnwrap(),
								validator: Address.fromUnsafe(action.validator)._unsafeUnwrap(),
								amount: Amount.fromUnsafe(action.amount)._unsafeUnwrap()
							}
							: action
				)
			}
		]
	}),

	[rpcSpec.methods[5].name]: (response: LookupTransactionEndpoint.Response): LookupTransactionEndpoint.DecodedResponse => ({
		txID: TransactionIdentifier.create(response.txID)._unsafeUnwrap(),
		sentAt: new Date(response.sentAt),
		fee: Amount.fromUnsafe(response.fee)._unsafeUnwrap(),
		message: response.message,
		actions: response.actions.map(action =>
			action.type === ActionType.TOKEN_TRANSFER
				? <ExecutedTransferTokensAction>{
					from: Address.fromUnsafe(action.from)._unsafeUnwrap(),
					to: Address.fromUnsafe(action.to)._unsafeUnwrap(),
					rri: ResourceIdentifier.fromUnsafe(action.rri)._unsafeUnwrap(),
					amount: Amount.fromUnsafe(action.amount)._unsafeUnwrap(),
				}
				: action.type === ActionType.STAKE_TOKENS || action.type === ActionType.UNSTAKE_TOKENS
					? <ExecutedStakeTokensAction>{
						from: Address.fromUnsafe(action.validator)._unsafeUnwrap(),
						validator: Address.fromUnsafe(action.validator)._unsafeUnwrap(),
						amount: Amount.fromUnsafe(action.amount)._unsafeUnwrap()
					}
					: action
		)
	}),

	[rpcSpec.methods[6].name]: (response: StakePositionsEndpoint.Response): StakePositionsEndpoint.DecodedResponse => ([
		{
			validator: Address.fromUnsafe(response[0].validator)._unsafeUnwrap(),
			amount: Amount.fromUnsafe(response[0].amount)._unsafeUnwrap()
		}
	]),

	[rpcSpec.methods[7].name]: (response: UnstakePositionsEndpoint.Response): UnstakePositionsEndpoint.DecodedResponse => ([
		{
			amount: Amount.fromUnsafe(response[0].amount)._unsafeUnwrap(),
			validator: Address.fromUnsafe(response[0].validator)._unsafeUnwrap(),
			epochsUntil: response[0].epochsUntil,
			withdrawTxID: TransactionIdentifier.create(response[0].withdrawTxID)._unsafeUnwrap(),
		}
	])
}

const client = nodeAPI(new URL('http://xyz'))

const testRpcMethod = (method: MethodObject, index: number) => {
	it(`should decode ${method.name} response`, async () => {
		const mockedResult =
			method.examples
				? (method.examples[0] as any).result.value
				: faker.generate(((method.result as ContentDescriptorObject).schema))

		mockClientReturnValue = mockedResult

		const expected = expectedDecodedResponses[method.name](mockedResult)

		// @ts-ignore
		const result = (await client[method.name](undefined))._unsafeUnwrap()

		const checkEquality = (obj1: Record<string, any>, obj2: Record<string, any>) => {
			if (obj1.equals) {
				if (!obj2.equals) throw Error(`Type mismatch when checking for equality.`)
				expect(obj1.equals(obj2)).toEqual(true)
			} else {
				for (const key in obj1) {
					const value1 = obj1[key]
					const value2 = obj2[key]

					isObject(value1)
						? checkEquality(value1, value2)
						: isArray(value1)
							? value1.forEach((item, i) => checkEquality(item as any, value2[i]))
							: expect(value1).toEqual(value2)
				}
			}
		}

		checkEquality(expected, result)
	})
}


describe('networking', () => {
	describe('json-rpc', () => {
		rpcSpec.methods.forEach((method, i) => testRpcMethod(method, i))
	})
})
