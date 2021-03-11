import { AddressT, Int32 } from '@radixdlt/account'
import { UserAction } from '@radixdlt/actions'
import { UInt256 } from '@radixdlt/uint256'
import { AtomIdentifierT, ResourceIdentifierT, TokenPermissions } from 'packages/atom/src/_types'
import { AmountT, Granularity } from 'packages/primitives/src/_types'

export enum Endpoint {
    UNIVERSE_MAGIC = 'radix.universeMagic',
    TOKEN_BALANCES = 'radix.tokenBalances',
    EXECUTED_TXS = 'radix.executedTransactions',
    STAKES = 'radix.stakes',
    UNSTAKES = 'radix.unstakes',
    TX_STATUS = 'radix.transactionStatus',
    NETWORK_TX_THROUGHPUT = 'radix.networkTransactionThroughput',
    NETWORK_TX_DEMAND = 'radix.networkTransactionDemand',
    VALIDATORS = 'radix.validators',
    NATIVE_TOKEN = 'radix.nativeToken',
    TOKEN_FEE_FOR_TX = 'radix.tokenFeeForTransaction'
}

type TransactionStatus = 'PENDING' | 'CONFIRMED' | 'FAILED'

type Transaction = {
    message: {
        msg: string,
        encryptionScheme: string
    },
    actions: UserAction[]
}

export namespace UniverseMagic {
    export type Input = []
    
    export type Response = {
        magic: Int32 // validation here?
    }
}

export namespace TokenBalances {
    export type Input = [address: string]
    
    // placeholder
    export type Response = {
        owner: string,
        tokenBalances: [
            {
                token: string,
                amount: string
            }
        ]

    }
}

export namespace ExecutedTransactions {
    export type Input = [address: string, size: number]
    
    export type Response = [
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
}
export namespace NativeToken {
    export type Input = []
    
    export type Response = {
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
}

export namespace TokenFeeForTransaction {
    export type Input = [transaction: Transaction]

    export type Response = {
        tokenFee: AmountT
    }
}

export namespace Stakes {
    export type Input = [address: string]

    export type Response = [
        {
            validator: AddressT,
            amount: AmountT
        }
    ]
}

export namespace Unstakes {
    // TODO
}

export namespace TransactionStatus {
    export type Input = [atomIdentifier: string]

    export type Response = {
        atomIdentifier: AtomIdentifierT,
        status: TransactionStatus,
        failure?: string
    }
}

export namespace NetworkTransactionThroughput {
    export type Input = []

    export type Response = {
        tps: number
    }
}

export namespace NetworkTransactionDemand {
    export type Input = []

    export type Response = {
        tps: number
    }
}

export namespace Validators {
    // TODO
}



