import { UserAction } from '@radixdlt/actions'
import { UInt256 } from '@radixdlt/uint256'

export enum Endpoint {
    GET_UNIVERSE = 'Universe.getUniverse',
    TOKEN_BALANCES = 'tokenBalances',
    EXECUTED_TXS = 'executedTransactions',
    STAKES = 'stakes',
    UNSTAKES = 'unstakes',
    TX_STATUS = 'transactionStatus',
    NETWORK_TX_THROUGHPUT = 'networkTransactionThroughput',
    NETWORK_TX_DEMAND = 'networkTransactionDemand',
    VALIDATORS = 'validators'
}

export type TokenBalancesInput = [address: string]

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