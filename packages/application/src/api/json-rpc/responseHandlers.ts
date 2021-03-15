import { decoder, JSONDecoding } from "@radixdlt/data-formats"
import { ok } from "neverthrow"
import { UInt256 } from '@radixdlt/uint256'
import { Amount } from "@radixdlt/primitives"
import { ExecutedTransactions, TokenBalances, UniverseMagic } from "./_types"
import { Address } from "@radixdlt/account"
import { makeTokenPermissions, ResourceIdentifier, TokenPermission } from "@radixdlt/atom"
import { BurnTokensAction, TransferTokensAction } from "@radixdlt/actions"
import { isObject } from "packages/util/src/typeGuards"

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
    )