/**
 * @jest-environment ./packages/application/test/_load-rpc.ts
 */
import { nodeAPI } from '../src/api/api'
import {
	BuildTransactionEndpoint,
	FinalizeTransactionEndpoint,
	LookupTransactionEndpoint,
	LookupValidatorEndpoint,
	NativeTokenEndpoint,
	NetworkIdEndpoint,
	NetworkTransactionDemandEndpoint,
	NetworkTransactionThroughputEndpoint,
	StakePositionsEndpoint,
	SubmitTransactionEndpoint,
	TokenBalancesEndpoint,
	TokenInfoEndpoint,
	TransactionHistoryEndpoint,
	TransactionStatusEndpoint,
	UnstakePositionsEndpoint,
	ValidatorsEndpoint,
} from '../src/api/json-rpc/_types'
import { Amount } from '@radixdlt/primitives'
import { UInt256 } from '@radixdlt/uint256'
import { TransactionIdentifier } from '../src/dto/transactionIdentifier'
import {
	ActionType,
	ExecutedAction,
	ExecutedOtherAction,
	ExecutedTransferTokensAction,
} from '../src/actions/_types'

import { isArray, isObject } from '@radixdlt/util'
import {
	ContentDescriptorObject,
	MethodObject,
	OpenrpcDocument,
} from '@open-rpc/meta-schema'
import {
	AccountAddress,
	NetworkT,
	ResourceIdentifier,
	ValidatorAddress,
} from '@radixdlt/account'
import {
	RawExecutedAction,
	RawToken,
	Token,
	TransactionIdentifierT,
	TransactionType,
} from '../src'

const faker = require('json-schema-faker')

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

const executedActionFromRaw = (action: RawExecutedAction): ExecutedAction => {
	if (action.type === ActionType.TOKEN_TRANSFER) {
		const executed: ExecutedTransferTokensAction = {
			...action,
			// transactionType: TransactionType.OUTGOING,
			from: AccountAddress.fromUnsafe(action.from)._unsafeUnwrap({
				withStackTrace: true,
			}),
			to: AccountAddress.fromUnsafe(action.to)._unsafeUnwrap({
				withStackTrace: true,
			}),
			rri: ResourceIdentifier.fromUnsafe(action.rri)._unsafeUnwrap({
				withStackTrace: true,
			}),
			amount: Amount.fromUnsafe(action.amount)._unsafeUnwrap({
				withStackTrace: true,
			}),
		}
		return executed
	} else if (
		action.type === ActionType.STAKE_TOKENS ||
		action.type === ActionType.UNSTAKE_TOKENS
	) {
		return {
			...action,
			from: AccountAddress.fromUnsafe(action.from)._unsafeUnwrap({
				withStackTrace: true,
			}),
			validator: ValidatorAddress.fromUnsafe(
				action.validator,
			)._unsafeUnwrap({ withStackTrace: true }),
			amount: Amount.fromUnsafe(action.amount)._unsafeUnwrap({
				withStackTrace: true,
			}),
		}
	} else {
		const executed: ExecutedOtherAction = {
			type: ActionType.OTHER,
		}
		return executed
	}
}

// @ts-ignore
const rpcSpec: OpenrpcDocument = global.rpcSpec

const tokenInfoFromResponse = (response: RawToken): Token => ({
	name: response.name,
	rri: ResourceIdentifier.fromUnsafe(response.rri)._unsafeUnwrap({
		withStackTrace: true,
	}),
	symbol: response.symbol,
	description: response.description,
	granularity: Amount.fromUnsafe(response.granularity)._unsafeUnwrap(),
	isSupplyMutable: response.isSupplyMutable,
	currentSupply: Amount.fromUnsafe(response.currentSupply)._unsafeUnwrap(),
	tokenInfoURL: new URL(response.tokenInfoURL),
	iconURL: new URL(response.iconURL),
})

const expectedDecodedResponses = {
	[rpcSpec.methods[0].name]: (
		response: NetworkIdEndpoint.Response,
	): NetworkIdEndpoint.DecodedResponse => ({
		networkId:
			response.networkId !== 1 ? NetworkT.BETANET : NetworkT.MAINNET,
	}),

	[rpcSpec.methods[1].name]: (
		response: NativeTokenEndpoint.Response,
	): NativeTokenEndpoint.DecodedResponse => tokenInfoFromResponse(response),

	[rpcSpec.methods[2].name]: (
		response: TokenInfoEndpoint.Response,
	): TokenInfoEndpoint.DecodedResponse => tokenInfoFromResponse(response),

	[rpcSpec.methods[3].name]: (
		response: TokenBalancesEndpoint.Response,
	): TokenBalancesEndpoint.DecodedResponse => ({
		owner: AccountAddress.fromUnsafe(response.owner)._unsafeUnwrap(),
		tokenBalances: [
			{
				tokenIdentifier: ResourceIdentifier.fromUnsafe(
					response.tokenBalances[0].rri,
				)._unsafeUnwrap({ withStackTrace: true }),
				amount: Amount.fromUnsafe(
					response.tokenBalances[0].amount,
				)._unsafeUnwrap(),
			},
		],
	}),

	[rpcSpec.methods[4].name]: (
		response: TransactionHistoryEndpoint.Response,
	): TransactionHistoryEndpoint.DecodedResponse => {
		const txID = TransactionIdentifier.create(
			response.transactions[0].txID,
		)._unsafeUnwrap({ withStackTrace: true })

		return {
			cursor: response.cursor,
			transactions: [
				{
					txID,
					sentAt: new Date(response.transactions[0].sentAt),
					fee: Amount.fromUnsafe(
						response.transactions[0].fee,
					)._unsafeUnwrap({ withStackTrace: true }),
					message: response.transactions[0].message,
					actions: response.transactions[0].actions.map((raw) =>
						executedActionFromRaw(raw),
					),
				},
			],
		}
	},

	[rpcSpec.methods[5].name]: (
		response: LookupTransactionEndpoint.Response,
	): LookupTransactionEndpoint.DecodedResponse => {
		const txID = TransactionIdentifier.create(response.txID)._unsafeUnwrap({
			withStackTrace: true,
		})

		return {
			txID,
			sentAt: new Date(response.sentAt),
			fee: Amount.fromUnsafe(response.fee)._unsafeUnwrap({
				withStackTrace: true,
			}),
			message: response.message,
			actions: response.actions.map((action) =>
				executedActionFromRaw(action),
			),
		}
	},

	[rpcSpec.methods[6].name]: (
		response: StakePositionsEndpoint.Response,
	): StakePositionsEndpoint.DecodedResponse => [
		{
			validator: ValidatorAddress.fromUnsafe(
				response[0].validator,
			)._unsafeUnwrap({ withStackTrace: true }),
			amount: Amount.fromUnsafe(response[0].amount)._unsafeUnwrap({
				withStackTrace: true,
			}),
		},
	],

	[rpcSpec.methods[7].name]: (
		response: UnstakePositionsEndpoint.Response,
	): UnstakePositionsEndpoint.DecodedResponse => [
		{
			amount: Amount.fromUnsafe(response[0].amount)._unsafeUnwrap({
				withStackTrace: true,
			}),
			validator: ValidatorAddress.fromUnsafe(
				response[0].validator,
			)._unsafeUnwrap({ withStackTrace: true }),
			epochsUntil: response[0].epochsUntil,
			withdrawTxID: TransactionIdentifier.create(
				response[0].withdrawTxID,
			)._unsafeUnwrap({ withStackTrace: true }),
		},
	],

	[rpcSpec.methods[8].name]: (
		response: TransactionStatusEndpoint.Response,
	): TransactionStatusEndpoint.DecodedResponse => ({
		txID: TransactionIdentifier.create(response.txID)._unsafeUnwrap({
			withStackTrace: true,
		}),
		status: response.status,
	}),

	[rpcSpec.methods[9].name]: (
		response: NetworkTransactionThroughputEndpoint.Response,
	): NetworkTransactionThroughputEndpoint.DecodedResponse => ({
		tps: response.tps,
	}),

	[rpcSpec.methods[10].name]: (
		response: NetworkTransactionDemandEndpoint.Response,
	): NetworkTransactionDemandEndpoint.DecodedResponse => ({
		tps: response.tps,
	}),

	[rpcSpec.methods[11].name]: (
		response: ValidatorsEndpoint.Response,
	): ValidatorsEndpoint.DecodedResponse => ({
		cursor: response.cursor,
		validators: [
			{
				address: ValidatorAddress.fromUnsafe(
					response.validators[0].address,
				)._unsafeUnwrap({ withStackTrace: true }),
				ownerAddress: AccountAddress.fromUnsafe(
					response.validators[0].ownerAddress,
				)._unsafeUnwrap({ withStackTrace: true }),
				name: response.validators[0].name,
				infoURL: new URL(response.validators[0].infoURL),
				totalDelegatedStake: Amount.fromUnsafe(
					response.validators[0].totalDelegatedStake,
				)._unsafeUnwrap({ withStackTrace: true }),
				ownerDelegation: Amount.fromUnsafe(
					response.validators[0].ownerDelegation,
				)._unsafeUnwrap({ withStackTrace: true }),
				isExternalStakeAccepted:
					response.validators[0].isExternalStakeAccepted,
			},
		],
	}),

	[rpcSpec.methods[12].name]: (
		response: LookupValidatorEndpoint.Response,
	): LookupValidatorEndpoint.DecodedResponse => ({
		address: ValidatorAddress.fromUnsafe(response.address)._unsafeUnwrap({
			withStackTrace: true,
		}),
		ownerAddress: AccountAddress.fromUnsafe(
			response.ownerAddress,
		)._unsafeUnwrap({
			withStackTrace: true,
		}),
		name: response.name,
		infoURL: new URL(response.infoURL),
		totalDelegatedStake: Amount.fromUnsafe(
			response.totalDelegatedStake,
		)._unsafeUnwrap({ withStackTrace: true }),
		ownerDelegation: Amount.fromUnsafe(
			response.ownerDelegation,
		)._unsafeUnwrap({ withStackTrace: true }),
		isExternalStakeAccepted: response.isExternalStakeAccepted,
	}),

	[rpcSpec.methods[13].name]: (
		response: BuildTransactionEndpoint.Response,
	): BuildTransactionEndpoint.DecodedResponse => ({
		transaction: {
			blob: response.transaction.blob,
			hashOfBlobToSign: response.transaction.hashOfBlobToSign,
		},
		fee: Amount.fromUnsafe(response.fee)._unsafeUnwrap({
			withStackTrace: true,
		}),
	}),

	[rpcSpec.methods[14].name]: (
		response: FinalizeTransactionEndpoint.Response,
	): FinalizeTransactionEndpoint.DecodedResponse => ({
		txID: TransactionIdentifier.create(response.txID)._unsafeUnwrap({
			withStackTrace: true,
		}),
	}),

	[rpcSpec.methods[15].name]: (
		response: SubmitTransactionEndpoint.Response,
	): SubmitTransactionEndpoint.DecodedResponse => ({
		txID: TransactionIdentifier.create(response.txID)._unsafeUnwrap({
			withStackTrace: true,
		}),
	}),
}

const client = nodeAPI(new URL('http://xyz'))

const testRpcMethod = (method: MethodObject, index: number) => {
	it(`should decode ${method.name} response`, async () => {
		const mockedResult = method.examples
			? (method.examples[0] as any).result.value
			: faker.generate((method.result as ContentDescriptorObject).schema)

		mockClientReturnValue = mockedResult

		const expected = expectedDecodedResponses[method.name](mockedResult)

		const result = ( // @ts-ignore
			await client[method.name.split('.')[1]](undefined)
		)._unsafeUnwrap({
			withStackTrace: true,
		})

		const checkEquality = (
			obj1: Record<string, any>,
			obj2: Record<string, any>,
		) => {
			if (obj1.equals) {
				if (!obj2.equals)
					throw Error(`Type mismatch when checking for equality.`)
				expect(obj1.equals(obj2)).toEqual(true)
			} else {
				for (const key in obj1) {
					const value1 = obj1[key]
					const value2 = obj2[key]

					isObject(value1)
						? checkEquality(value1, value2)
						: isArray(value1)
						? value1.forEach((item, i) =>
								checkEquality(item as any, value2[i]),
						  )
						: expect(value1).toEqual(value2)
				}
			}
		}

		checkEquality(expected, result)
	})
}

describe('json-rpc spec', () => {
	rpcSpec.methods.forEach((method, i) => testRpcMethod(method, i))
})
