import { decoder, JSONDecoding } from "@radixdlt/data-formats"
import { ok } from "neverthrow"
import { UInt256 } from '@radixdlt/uint256'
import { Amount } from "@radixdlt/primitives"
import { ExecutedTransactions, TokenBalances, UniverseMagic } from "./_types"
import { Address } from "@radixdlt/account"
import { ResourceIdentifier } from "@radixdlt/atom"
import { TransferTokensAction } from "@radixdlt/actions"

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

export const handleExecutedTransactionsResponse =
    JSONDecoding.withDecoders(
        amountDecoder('amount', 'fee'),
        dateDecoder('sentAt'),
        addressDecoder('from', 'to'),
        RRIDecoder('resourceIdentifier'),
        TransferTokensAction.JSONDecoder
    ).create<ExecutedTransactions.Response>()
        .fromJSON

export const handleUniverseMagicResponse =
    JSONDecoding.withDecoders().create<UniverseMagic.Response>().fromJSON

export const handleTokenBalancesResponse =
    JSONDecoding.withDecoders(
        addressDecoder('owner'),
        RRIDecoder('token'),
        amountDecoder('amount')
    ).create<TokenBalances.Response>()
        .fromJSON