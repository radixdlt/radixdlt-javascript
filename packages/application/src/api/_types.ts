import { Int32 } from '@radixdlt/account'
import { UserAction } from '@radixdlt/actions'
import { UInt256 } from '@radixdlt/uint256'
import { ResourceIdentifierT, TokenPermissions } from 'packages/atom/src/_types'
import { AmountT, Granularity } from 'packages/primitives/src/_types'

export enum Endpoint {
    UNIVERSE_MAGIC = 'universeMagic',
    TOKEN_BALANCES = 'tokenBalances',
    EXECUTED_TXS = 'executedTransactions',
    STAKES = 'stakes',
    UNSTAKES = 'unstakes',
    TX_STATUS = 'transactionStatus',
    NETWORK_TX_THROUGHPUT = 'networkTransactionThroughput',
    NETWORK_TX_DEMAND = 'networkTransactionDemand',
    VALIDATORS = 'validators'
}

export type UniverseMagicInput = []

export type UniverseMagicResponse = {
    magic: Int32 // validation here?
}

export type TokenBalancesInput = [address: string]

// placeholder
export type TokenBalancesResponse = {
    owner: string,
    tokenBalances: [
        {
            token: string,
            amount: string
        }
    ]
}

export type ExecutedTransactionsInput = [address: string, size: number]

export type ExecutedTransactionsResponse = [
    {
        atomId: string,
        sentAt: Date,
        fee: UInt256,
        cursor: string,
        message?: {
            msg: string,
            encryptionScheme: string
        },
        actions: UserAction[]
    }
]

export type NativeTokenInput = []

export type NativeTokenResponse = {
	name: string,
    rri: ResourceIdentifierT,
    symbol: string,
	description?: string,
	granularity: Granularity,
    isSupplyMutable: boolean,
    currentSupply: AmountT,
    tokenInfoURL: URL,
    iconURL: URL,
    tokenPermission: TokenPermissions
}



// Should come from a shared schema ?
export enum ActionType { 
    TOKEN_TRANSFER = "tokenTransfer"
}

// Same as above
export type encodedUserAction = {
    type: ActionType
}