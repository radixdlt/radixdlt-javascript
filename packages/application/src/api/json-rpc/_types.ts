import { Int32 } from '@radixdlt/account'
import { Magic } from '@radixdlt/primitives'
import {
	ExecutedTransaction,
	NetworkTransactionDemand,
	NetworkTransactionThroughput,
	PendingTransaction,
	RawExecutedTransaction,
	RawToken,
	StakePositions,
	StatusOfTransaction,
	Token,
	TokenBalances,
	TransactionHistory,
	TransactionIntent,
	TransactionStatus,
	UnsignedTransaction,
	UnstakePositions,
	Validators,
} from '../../dto/_types'

type API_PREFIX = 'radix'

export enum ApiMethod {
	NETWORK_ID = 'networkId',
	TOKEN_BALANCES = 'tokenBalances',
	TRANSACTION_HISTORY = 'transactionHistory',
	STAKES = 'stakes',
	UNSTAKES = 'unstakes',
	TX_STATUS = 'transactionStatus',
	NETWORK_TX_THROUGHPUT = 'networkTransactionThroughput',
	NETWORK_TX_DEMAND = 'networkTransactionDemand',
	VALIDATORS = 'validators',
	LOOKUP_TX = 'lookupTransaction',
	NATIVE_TOKEN = 'nativeToken',
	TOKEN_INFO = 'tokenInfo',
	BUILD_TX_FROM_INTENT = 'buildTransaction',
	SUBMIT_SIGNED_TX = 'submitSignedTransaction',
}

export type Endpoint = `${API_PREFIX}.${typeof ApiMethod[keyof typeof ApiMethod]}`

export namespace NetworkIdEndpoint {
	export type Input = []

	export type Response = {
		networkId: Int32
	}

	export type DecodedResponse = {
		networkId: Magic
	}
}

export namespace TokenBalancesEndpoint {
	export type Input = [address: string]

	export type Response = {
		owner: string
		tokenBalances: [
			{
				token: string
				amount: string
			},
		]
	}

	export type DecodedResponse = TokenBalances
}

export namespace TransactionHistoryEndpoint {
	export type Input = [
		address: string,
		size: number, // must be > 0
		cursor?: string, // TransactionIdentifier
	]

	export type Response = Readonly<{
		cursor: string
		transactions: RawExecutedTransaction[]
	}>

	export type DecodedResponse = TransactionHistory
}

export namespace LookupTransactionEndpoint {
	export type Input = [txID: string]
	export type Response = RawExecutedTransaction
	export type DecodedResponse = ExecutedTransaction
}

export namespace TokenInfoEndpoint {
	export type Input = [rri: string]
	export type Response = RawToken
	export type DecodedResponse = Token
}

export namespace NativeTokenEndpoint {
	export type Input = []
	export type Response = RawToken
	export type DecodedResponse = Token
}

export namespace StakePositionsEndpoint {
	export type Input = [address: string]

	export type Response = {
		validator: string
		amount: string
	}[]

	export type DecodedResponse = StakePositions
}

export namespace UnstakesEndpoint {
	export type Input = [address: string]

	export type Response = {
		validator: string
		amount: string
		epochsUntil: number
		withdrawTxID: string
	}[]

	export type DecodedResponse = UnstakePositions
}

export namespace TransactionStatusEndpoint {
	export type Input = [txID: string]

	export type Response = {
		txID: string
		status: TransactionStatus
		failure?: string
	}

	export type DecodedResponse = StatusOfTransaction
}

export namespace NetworkTransactionThroughputEndpoint {
	export type Input = []

	export type Response = {
		tps: number
	}

	export type DecodedResponse = NetworkTransactionThroughput
}

export namespace NetworkTransactionDemandEndpoint {
	export type Input = []

	export type Response = {
		tps: number
	}

	export type DecodedResponse = NetworkTransactionDemand
}

export namespace ValidatorsEndpoint {
	export type Input = [size: number, cursor?: string]

	export type Response = Readonly<{
		cursor: string
		validators: {
			address: string
			ownerAddress: string
			name: string
			infoURL: string
			totalDelegatedStake: string
			ownerDelegation: string
			isExternalStakeAccepted: boolean
		}[]
	}>
	export type DecodedResponse = Validators
}

export namespace BuildTransactionEndpoint {
	export type Failure =
		| 'MALFORMED_TX'
		| 'INSUFFICIENT_FUNDS'
		| 'NOT_PERMITTED'

	export type Input = [transactionIntent: TransactionIntent]

	export type Response = {
		transaction: Readonly<{
			blob: string
			hashOfBlobToSign: string
		}>
		fee: string
		failure?: Failure
	}

	export type DecodedResponse = UnsignedTransaction
}

export namespace SubmitSignedTransactionEndpoint {
	export type Input = [
		transaction: Readonly<{
			blob: string
		}>,
		signatureDER: string,
	]

	export type Response = {
		txID: string
		errorMessage?: string
	}

	export type DecodedResponse = PendingTransaction
}
