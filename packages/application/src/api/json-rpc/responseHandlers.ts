import { decoder, JSONDecoding } from '@radixdlt/data-formats'
import { ok } from 'neverthrow'
import { UInt256 } from '@radixdlt/uint256'
import { Amount, magicFromNumber } from '@radixdlt/primitives'

import { Address } from '@radixdlt/account'

import { isObject } from '@radixdlt/util'
import {
	BuildTransactionEndpoint,
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
import { TransferTokensAction } from '../../actions/transferTokensAction'
import { StakeTokensAction } from '../../actions/stakeTokensAction'
import { UnstakeTokensAction } from '../../actions/unstakeTokensAction'
import { OtherAction } from '../../actions/otherAction'

const amountDecoder = (...keys: string[]) =>
	decoder((value, key) =>
		key !== undefined && keys.includes(key) && typeof value === 'string'
			? ok(Amount.inSmallestDenomination(new UInt256(value)))
			: undefined,
	)

const dateDecoder = (...keys: string[]) =>
	decoder((value, key) =>
		key !== undefined && keys.includes(key) && typeof value === 'string'
			? ok(new Date(value))
			: undefined,
	)

const addressDecoder = (...keys: string[]) =>
	decoder((value, key) =>
		key !== undefined && keys.includes(key) && typeof value === 'string'
			? Address.fromBase58String(value)
			: undefined,
	)

const RRIDecoder = (...keys: string[]) =>
	decoder((value, key) =>
		key !== undefined && keys.includes(key) && typeof value === 'string'
			? ResourceIdentifier.fromString(value)
			: undefined,
	)

const URLDecoder = (...keys: string[]) =>
	decoder((value, key) =>
		key !== undefined && keys.includes(key) && typeof value === 'string'
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
		key !== undefined && keys.includes(key) && typeof value === 'string'
			? TransactionIdentifier.create(value)
			: undefined,
	)

const magicDecoder = (...keys: string[]) =>
	decoder((value, key) =>
		key !== undefined && keys.includes(key) && typeof value === 'number'
			? ok(magicFromNumber(value))
			: undefined,
	)

const executedTXDecoders = JSONDecoding.withDecoders(
	amountDecoder('amount', 'fee'),
	dateDecoder('sentAt'),
	addressDecoder('from', 'to', 'validator'),
	transactionIdentifierDecoder('txID'),
	RRIDecoder('resourceIdentifier'),
	TransferTokensAction.JSONDecoder,
	StakeTokensAction.JSONDecoder,
	UnstakeTokensAction.JSONDecoder,
	OtherAction.JSONDecoder,
)

export const handleTransactionHistoryResponse = executedTXDecoders.create<TransactionHistoryEndpoint.DecodedResponse>()
	.fromJSON

export const handleLookupTXResponse = executedTXDecoders.create<LookupTransactionEndpoint.DecodedResponse>()
	.fromJSON

export const handleNetworkIdResponse = JSONDecoding.withDecoders(
	magicDecoder('networkId'),
).create<NetworkIdEndpoint.DecodedResponse>().fromJSON

export const handleTokenBalancesResponse = JSONDecoding.withDecoders(
	addressDecoder('owner'),
	RRIDecoder('token'),
	amountDecoder('amount'),
).create<TokenBalancesEndpoint.DecodedResponse>().fromJSON

export const handleValidatorsResponse = JSONDecoding.withDecoders(
	addressDecoder('owner'),
).create<ValidatorsEndpoint.DecodedResponse>().fromJSON

export const handleTokenInfoResponse = JSONDecoding.withDecoders(
	RRIDecoder('rri'),
	amountDecoder('granularity', 'currentSupply'),
	URLDecoder('tokenInfoURL', 'iconURL'),
	tokenPermissionsDecoder('tokenPermission'),
).create<TokenInfoEndpoint.DecodedResponse>().fromJSON

export const handleStakesResponse = JSONDecoding.withDecoders(
	addressDecoder('validator'),
	amountDecoder('amount'),
).create<StakePositionsEndpoint.DecodedResponse>().fromJSON

export const handleUnstakesResponse = JSONDecoding.withDecoders(
	addressDecoder('validator'),
	amountDecoder('amount'),
).create<UnstakesEndpoint.DecodedResponse>().fromJSON

export const handleTransactionStatusResponse = JSONDecoding.withDecoders(
	transactionIdentifierDecoder('txID'),
).create<TransactionStatusEndpoint.DecodedResponse>().fromJSON

export const handleNetworkTxThroughputResponse = JSONDecoding.create<NetworkTransactionThroughputEndpoint.DecodedResponse>()
	.fromJSON

export const handleNetworkTxDemandResponse = JSONDecoding.create<NetworkTransactionDemandEndpoint.DecodedResponse>()
	.fromJSON

export const handleBuildTransactionResponse = JSONDecoding.create<BuildTransactionEndpoint.DecodedResponse>()
	.fromJSON

export const handleSubmitSignedTransactionResponse = JSONDecoding.withDecoders(
	transactionIdentifierDecoder('txID'),
).create<SubmitSignedTransactionEndpoint.DecodedResponse>().fromJSON
