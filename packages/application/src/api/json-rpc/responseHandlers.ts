import { decoder, JSONDecoding } from "@radixdlt/data-formats"
import { ok } from "neverthrow"
import { UInt256 } from '@radixdlt/uint256'
import { Amount } from "@radixdlt/primitives"
import { ExecutedTransactions, NativeToken, Stakes, TokenBalances, TokenFeeForTransaction, UniverseMagic, TransactionStatus, NetworkTransactionThroughput, NetworkTransactionDemand, GetAtomForTransaction, SubmitSignedAtom } from "./_types"
import { Address } from "@radixdlt/account"
import { AtomIdentifier, makeTokenPermissions, ResourceIdentifier, TokenPermission } from "@radixdlt/atom"
import { BurnTokensAction, TransferTokensAction } from "@radixdlt/actions"
import { isObject } from "@radixdlt/util"

const amountDecoder = (...keys: string[]) => decoder((value, key) =>
    key !== undefined && keys.includes(key) && typeof value === 'string'
        ? ok(Amount.inSmallestDenomination(new UInt256(value)))
        : undefined
)

const dateDecoder = (...keys: string[]) => decoder((value, key) =>
    key !== undefined && keys.includes(key) && typeof value === 'string'
        ? ok(new Date(value))
        : undefined
)

const addressDecoder = (...keys: string[]) => decoder((value, key) =>
    key !== undefined && keys.includes(key) && typeof value === 'string'
        ? Address.fromBase58String(value)
        : undefined
)

const RRIDecoder = (...keys: string[]) => decoder((value, key) =>
    key !== undefined && keys.includes(key) && typeof value === 'string'
        ? ResourceIdentifier.fromString(value)
        : undefined
)

const URLDecoder = (...keys: string[]) => decoder((value, key) =>
    key !== undefined && keys.includes(key) && typeof value === 'string'
        ? ok(new URL(value))
        : undefined
)

const tokenPermissionsDecoder = (...keys: string[]) => decoder((value, key) =>
    key !== undefined && keys.includes(key) && isObject(value)
        ? ok(makeTokenPermissions(value as Readonly<{ mint: TokenPermission; burn: TokenPermission; }>))
        : undefined
)

const atomIdentifierDecoder = (...keys: string[]) => decoder((value, key) =>
    key !== undefined && keys.includes(key) && typeof value === 'string'
        ? AtomIdentifier.create(value)
        : undefined
)

export const handleExecutedTransactionsResponse =
    JSONDecoding.withDecoders(
        amountDecoder('amount', 'fee'),
        dateDecoder('sentAt'),
        addressDecoder('from', 'to', 'burner'),
        RRIDecoder('resourceIdentifier'),
        TransferTokensAction.JSONDecoder,
        BurnTokensAction.JSONDecoder
    ).create<ExecutedTransactions.DecodedResponse>()
        .fromJSON

export const handleUniverseMagicResponse =
    JSONDecoding.withDecoders().create<UniverseMagic.DecodedResponse>().fromJSON

export const handleTokenBalancesResponse =
    JSONDecoding.withDecoders(
        addressDecoder('owner'),
        RRIDecoder('token'),
        amountDecoder('amount')
    ).create<TokenBalances.DecodedResponse>()
        .fromJSON

export const handleNativeTokenResponse =
    JSONDecoding.withDecoders(
        RRIDecoder('rri'),
        amountDecoder('granularity', 'currentSupply'),
        URLDecoder('tokenInfoURL', 'iconURL'),
        tokenPermissionsDecoder('tokenPermission')
    ).create<NativeToken.DecodedResponse>()
        .fromJSON

export const handleTokenFeeForTxResponse =
    JSONDecoding.withDecoders(
        amountDecoder('tokenFee')
    ).create<TokenFeeForTransaction.DecodedResponse>()
        .fromJSON

export const handleStakesResponse =
    JSONDecoding.withDecoders(
        addressDecoder('validator'),
        amountDecoder('amount')
    ).create<Stakes.DecodedResponse>()
        .fromJSON

export const handleTransactionStatusResponse =
    JSONDecoding.withDecoders(
        atomIdentifierDecoder('atomIdentifier'),
    ).create<TransactionStatus.DecodedResponse>()
        .fromJSON

export const handleNetworkTxThroughputResponse =
    JSONDecoding.create<NetworkTransactionThroughput.DecodedResponse>().fromJSON

export const handleNetworkTxDemandResponse =
    JSONDecoding.create<NetworkTransactionDemand.DecodedResponse>().fromJSON

export const handleGetAtomForTxResponse =
    JSONDecoding.create<GetAtomForTransaction.DecodedResponse>().fromJSON

export const handleSubmitSignedAtomResponse =
    JSONDecoding.withDecoders(
        atomIdentifierDecoder('atomIdentifier')
    ).create<SubmitSignedAtom.DecodedResponse>()
    .fromJSON