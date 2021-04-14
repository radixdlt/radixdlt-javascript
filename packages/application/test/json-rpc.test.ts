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
import { Amount, magicFromNumber } from '@radixdlt/primitives'
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
import { isArray, isObject, LogLevel } from '@radixdlt/util'
import { MethodObject, OpenrpcDocument, ContentDescriptorObject } from '@open-rpc/meta-schema'
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
let rpcSpec: OpenrpcDocument = process['rpcSpec']

const expectedDecodedResponses = {
	[rpcSpec.methods[0].name]: (response: NetworkIdEndpoint.Response) => (<NetworkIdEndpoint.DecodedResponse>{
		networkId: magicFromNumber(response.networkId),
	}),

	[rpcSpec.methods[1].name]: (response: NativeTokenEndpoint.Response) => (<NativeTokenEndpoint.DecodedResponse>{
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

	[rpcSpec.methods[3].name]: (response: TokenBalancesEndpoint.Response) => (<TokenBalancesEndpoint.DecodedResponse>{
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
	})
}

const client = nodeAPI(new URL('http://xyz'))

const testRpcMethod = (method: MethodObject) => {
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
		rpcSpec.methods.forEach(method => {
			testRpcMethod(method)
		})
	})
})
