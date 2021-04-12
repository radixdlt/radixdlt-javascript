import { decoder, JSONDecoding } from '@radixdlt/data-formats'
import { err, ok, Result } from 'neverthrow'
import { UInt256 } from '@radixdlt/uint256'
import { Amount, magicFromNumber } from '@radixdlt/primitives'

import { Address } from '@radixdlt/account'

import { isObject, isString } from '@radixdlt/util'
import {
	BuildTransactionEndpoint,
	FinalizeTransactionEndpoint,
	LookupTransactionEndpoint,
	NetworkIdEndpoint,
	NetworkTransactionDemandEndpoint,
	NetworkTransactionThroughputEndpoint,
	StakePositionsEndpoint,
	SubmitSignedTransactionEndpoint,
	TokenBalancesEndpoint,
	TokenInfoEndpoint,
	TransactionHistoryEndpoint,
	TransactionStatusEndpoint,
	UnstakesEndpoint,
	ValidatorsEndpoint,
} from './_types'
import { TransactionIdentifier } from '../../dto/transactionIdentifier'
import { makeTokenPermissions } from '../../dto/tokenPermissions'
import { TokenPermission } from '../../dto/_types'
import { ResourceIdentifier } from '../../dto/resourceIdentifier'

const amountDecoder = (...keys: string[]) =>
	decoder((value, key) =>
		key !== undefined && keys.includes(key) && isString(value)
			? ok(Amount.inSmallestDenomination(new UInt256(value)))
			: undefined,
	)

const dateDecoder = (...keys: string[]) =>
	decoder((value, key) =>
		key !== undefined && keys.includes(key) && isString(value)
			? ok(new Date(value))
			: undefined,
	)

const RRIDecoder = (...keys: string[]) =>
	decoder((value, key) =>
		key !== undefined && keys.includes(key) && isString(value)
			? ResourceIdentifier.fromString(value)
			: undefined,
	)

const URLDecoder = (...keys: string[]) =>
	decoder((value, key) =>
		key !== undefined && keys.includes(key) && isString(value)
			? ok(new URL(value))
			: undefined,
	)

const tokenPermissionsDecoder = (...keys: string[]) =>
	decoder((value, key) =>
		key !== undefined && keys.includes(key) && isObject(value)
			? ok(
					makeTokenPermissions(
						value as Readonly<{
							mint: TokenPermission
							burn: TokenPermission
						}>,
					),
			  )
			: undefined,
	)

const transactionIdentifierDecoder = (...keys: string[]) =>
	decoder((value, key) =>
		key !== undefined && keys.includes(key) && isString(value)
			? TransactionIdentifier.create(value)
			: undefined,
	)

const magicDecoder = (...keys: string[]) =>
	decoder((value, key) =>
		key !== undefined && keys.includes(key) && typeof value === 'number'
			? ok(magicFromNumber(value))
			: undefined,
	)

const addressDecoder = (...keys: string[]) =>
	decoder((value, key) =>
		key !== undefined && keys.includes(key) && isString(value)
			? Address.fromBase58String(value)
			: undefined,
	)

const executedTXDecoders = JSONDecoding.withDecoders(
	amountDecoder('amount', 'fee'),
	dateDecoder('sentAt'),
	addressDecoder('from', 'to', 'validator'),
	transactionIdentifierDecoder('txID'),
	RRIDecoder('rri'),
)

export type RPCRequestFailureResponse = Readonly<{
	failure: string
}>

const isRPCRequestFailureResponse = (
	something: unknown,
): something is RPCRequestFailureResponse => {
	const inspection = something as RPCRequestFailureResponse
	return inspection.failure !== undefined
}

export const handleTransactionHistoryResponse = executedTXDecoders.create<TransactionHistoryEndpoint.DecodedResponse>()

export const handleLookupTXResponse = executedTXDecoders.create<LookupTransactionEndpoint.DecodedResponse>()

export const handleNetworkIdResponse = JSONDecoding.withDecoders(
	magicDecoder('networkId'),
).create<NetworkIdEndpoint.DecodedResponse>()

export const handleTokenBalancesResponse = JSONDecoding.withDecoders(
	addressDecoder('owner'),
	RRIDecoder('token'),
	amountDecoder('amount'),
).create<TokenBalancesEndpoint.DecodedResponse>()

export const handleValidatorsResponse = JSONDecoding.withDecoders(
	addressDecoder('owner'),
).create<ValidatorsEndpoint.DecodedResponse>()

export const handleTokenInfoResponse = JSONDecoding.withDecoders(
	RRIDecoder('rri'),
	amountDecoder('granularity', 'currentSupply'),
	URLDecoder('tokenInfoURL', 'iconURL'),
	tokenPermissionsDecoder('tokenPermission'),
).create<TokenInfoEndpoint.DecodedResponse>()

export const handleStakesResponse = JSONDecoding.withDecoders(
	addressDecoder('validator'),
	amountDecoder('amount'),
).create<StakePositionsEndpoint.DecodedResponse>()

export const handleUnstakesResponse = JSONDecoding.withDecoders(
	addressDecoder('validator'),
	amountDecoder('amount'),
).create<UnstakesEndpoint.DecodedResponse>()

export const handleTransactionStatusResponse = (
	json: unknown,
): Result<TransactionStatusEndpoint.DecodedResponse, Error[]> =>
	isRPCRequestFailureResponse(json)
		? err([new Error(json.failure)])
		: JSONDecoding.withDecoders(
				transactionIdentifierDecoder('txID'),
		  ).create<TransactionStatusEndpoint.DecodedResponse>()(json)

export const handleNetworkTxThroughputResponse = JSONDecoding.create<NetworkTransactionThroughputEndpoint.DecodedResponse>()

export const handleNetworkTxDemandResponse = JSONDecoding.create<NetworkTransactionDemandEndpoint.DecodedResponse>()

export const handleBuildTransactionResponse = (
	json: unknown,
): Result<BuildTransactionEndpoint.DecodedResponse, Error[]> =>
	isRPCRequestFailureResponse(json)
		? err([new Error(json.failure)])
		: JSONDecoding.create<BuildTransactionEndpoint.DecodedResponse>()(json)

export const handleSubmitSignedTransactionResponse = (
	json: unknown,
): Result<SubmitSignedTransactionEndpoint.DecodedResponse, Error[]> =>
	isRPCRequestFailureResponse(json)
		? err([new Error(json.failure)])
		: JSONDecoding.withDecoders(
				transactionIdentifierDecoder('txID'),
		  ).create<SubmitSignedTransactionEndpoint.DecodedResponse>()(json)

export const handleFinalizedTransactionResponse = (
	json: unknown,
): Result<FinalizeTransactionEndpoint.DecodedResponse, Error[]> =>
	isRPCRequestFailureResponse(json)
		? err([new Error(json.failure)])
		: JSONDecoding.withDecoders(
				transactionIdentifierDecoder('txID'),
		  ).create<FinalizeTransactionEndpoint.DecodedResponse>()(json)
