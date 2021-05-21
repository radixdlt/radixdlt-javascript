import { NetworkT } from '@radixdlt/account'
import { ActionType } from '../../actions'
import {
	SimpleExecutedTransaction,
	NetworkTransactionDemand,
	NetworkTransactionThroughput,
	PendingTransaction,
	RawExecutedTransaction,
	RawToken,
	FinalizedTransaction,
	StakePositions,
	StatusOfTransaction,
	Token,
	SimpleTransactionHistory,
	TransactionStatus,
	BuiltTransaction,
	UnstakePositions,
	Validators,
	SimpleTokenBalances,
	Validator,
	RawValidatorResponse,
} from '../../dto'

type API_PREFIX = 'radix'

export enum ApiMethod {
	NETWORK_ID = 'networkId',
	TOKEN_BALANCES = 'tokenBalances',
	TRANSACTION_HISTORY = 'transactionHistory',
	STAKES = 'stakePositions',
	UNSTAKES = 'unstakePositions',
	TX_STATUS = 'statusOfTransaction',
	NETWORK_TX_THROUGHPUT = 'networkTransactionThroughput',
	NETWORK_TX_DEMAND = 'networkTransactionDemand',
	VALIDATORS = 'validators',
	LOOKUP_TX = 'lookupTransaction',
	LOOKUP_VALIDATOR = 'lookupValidator',
	NATIVE_TOKEN = 'nativeToken',
	TOKEN_INFO = 'tokenInfo',
	BUILD_TX_FROM_INTENT = 'buildTransaction',
	SUBMIT_TX = 'submitTransaction',
	FINALIZE_TX = 'finalizeTransaction',
}

export type Endpoint = `${API_PREFIX}.${typeof ApiMethod[keyof typeof ApiMethod]}`

export namespace NetworkIdEndpoint {
	export type Input = {}

	export type Response = {
		networkId: number
	}

	export type DecodedResponse = {
		networkId: NetworkT
	}
}

export namespace TokenBalancesEndpoint {
	export type Input = {
		address: string
	}

	export type Response = {
		owner: string
		tokenBalances: {
			rri: string
			amount: string
		}[]
	}

	export type DecodedResponse = SimpleTokenBalances
}

export namespace TransactionHistoryEndpoint {
	export type Input = {
		address: string,
		size: number, // must be > 0
		cursor?: string,
	}

	export type Response = Readonly<{
		cursor: string
		transactions: RawExecutedTransaction[]
	}>

	export type DecodedResponse = SimpleTransactionHistory
}

export namespace LookupTransactionEndpoint {
	export type Input = { txID: string }
	export type Response = RawExecutedTransaction
	export type DecodedResponse = SimpleExecutedTransaction
}

export namespace TokenInfoEndpoint {
	export type Input = { rri: string }
	export type Response = RawToken
	export type DecodedResponse = Token
}

export namespace NativeTokenEndpoint {
	export type Input = {}
	export type Response = RawToken
	export type DecodedResponse = Token
}

export namespace StakePositionsEndpoint {
	export type Input = { address: string }

	export type Response = {
		validator: string
		amount: string
	}[]

	export type DecodedResponse = StakePositions
}

export namespace UnstakePositionsEndpoint {
	export type Input = { address: string }

	export type Response = {
		amount: string
		validator: string
		epochsUntil: number
		withdrawTxID: string
	}[]

	export type DecodedResponse = UnstakePositions
}

export namespace TransactionStatusEndpoint {
	export type Input = { txID: string }

	export type Response = {
		txID: string
		status: TransactionStatus
		failure?: string
	}

	export type DecodedResponse = StatusOfTransaction
}

export namespace NetworkTransactionThroughputEndpoint {
	export type Input = {}

	export type Response = {
		tps: number
	}

	export type DecodedResponse = NetworkTransactionThroughput
}

export namespace NetworkTransactionDemandEndpoint {
	export type Input = {}

	export type Response = {
		tps: number
	}

	export type DecodedResponse = NetworkTransactionDemand
}

export namespace ValidatorsEndpoint {
	export type Input = { size: number, cursor?: string }

	export type Response = Readonly<{
		cursor: string
		validators: RawValidatorResponse[]
	}>
	export type DecodedResponse = Validators
}

export namespace LookupValidatorEndpoint {
	export type Input = { validatorAddress: string }
	export type Response = RawValidatorResponse
	export type DecodedResponse = Validator
}

export namespace BuildTransactionEndpoint {
	export type Failure =
		| 'MALFORMED_TX'
		| 'INSUFFICIENT_FUNDS'
		| 'NOT_PERMITTED'

	export type Input = {
		actions: (
			| {
				type: ActionType.TOKEN_TRANSFER
				from: string
				to: string
				amount: string
				tokenIdentifier: string
			}
			| {
				type: ActionType.STAKE_TOKENS
				from: string
				validator: string
				amount: string
			}
			| {
				type: ActionType.UNSTAKE_TOKENS
				from: string
				validator: string
				amount: string
			}
		)[],
		message?: string,
	}

	export type Response = {
		transaction: Readonly<{
			blob: string
			hashOfBlobToSign: string
		}>
		fee: string
	}

	export type DecodedResponse = BuiltTransaction
}

export namespace FinalizeTransactionEndpoint {
	export type Input = {
		transaction: Readonly<{
			blob: string
		}>,
		publicKeyOfSigner: string,
		signatureDER: string,
	}

	export type Response = {
		txID: string
	}

	export type DecodedResponse = FinalizedTransaction
}

export namespace SubmitTransactionEndpoint {
	export type Input = {
		transaction: Readonly<{
			blob: string
		}>,
		publicKeyOfSigner: string,
		signatureDER: string,
		txID: string,
	}

	export type Response = {
		txID: string
	}

	export type DecodedResponse = PendingTransaction
}
