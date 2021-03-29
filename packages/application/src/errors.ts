type ErrorT<Category extends ErrorCategory, Cause extends ErrorCause> = {
	category: Category
	cause: Cause
	message: string
}

export enum ErrorCategory {
	NODE = 'node',
	WALLET = 'wallet',
	API = 'api',
}

export enum WalletErrorCause {
	LOAD_KEYSTORE_FAILED = 'LOAD_KEYSTORE_FAILED',
}

export enum NodeErrorCause {
	GET_NODE_FAILED = 'GET_NODE_FAILED',
}

export enum APIErrorCause {
	TOKEN_BALANCES_FAILED = 'TOKEN_BALANCES_FAILED',
	TRANSACTION_HISTORY_FAILED = 'TRANSACTION_HISTORY_FAILED',
	NATIVE_TOKEN_FAILED = 'NATIVE_TOKEN_FAILED',
	TOKEN_INFO_FAILED = 'TOKEN_INFO_FAILED',
	STAKES_FOR_ADDRESS_FAILED = 'STAKES_FOR_ADDRESS_FAILED',
	UNSTAKES_FOR_ADDRESS_FAILED = 'UNSTAKES_FOR_ADDRESS_FAILED',
	TX_STATUS_FAILED = 'TX_STATUS_FAILED',
	NETWORK_TX_THROUGHPUT_FAILED = 'NETWORK_TX_THROUGHPUT_FAILED',
	NETWORK_TX_DEMAND_FAILED = 'NETWORK_TX_DEMAND_FAILED',
	LOOKUP_TX_FAILED = 'LOOKUP_TX_FAILED',
	VALIDATORS_FAILED = 'VALIDATORS_FAILED',
	BUILD_TRANSACTION_FAILED = 'BUILD_TRANSACTION_FAILED',
	SUBMIT_SIGNED_TX_FAILED = 'SUBMIT_SIGNED_TX_FAILED',
	NETWORK_ID_FAILED = 'NETWORK_ID_FAILED',
}

export type ErrorCause = APIErrorCause | WalletErrorCause | NodeErrorCause

type APIError = ErrorT<ErrorCategory.API, APIErrorCause>
type WalletError = ErrorT<ErrorCategory.WALLET, WalletErrorCause>
type NodeError = ErrorT<ErrorCategory.NODE, NodeErrorCause>

export type ErrorNotification = NodeError | WalletError | APIError

const Error = <E extends ErrorCategory, C extends ErrorCause>(category: E) => (
	cause: C,
) => (message: string): ErrorT<E, C> => ({
	category,
	cause,
	message,
})

export const APIError = Error<ErrorCategory.API, APIErrorCause>(
	ErrorCategory.API,
)
export const nodeError = Error<ErrorCategory.NODE, NodeErrorCause>(
	ErrorCategory.NODE,
)
export const walletError = Error<ErrorCategory.WALLET, WalletErrorCause>(
	ErrorCategory.WALLET,
)

export const tokenBalancesErr = APIError(APIErrorCause.TOKEN_BALANCES_FAILED)
export const transactionHistoryErr = APIError(
	APIErrorCause.TRANSACTION_HISTORY_FAILED,
)
export const nativeTokenErr = APIError(APIErrorCause.NATIVE_TOKEN_FAILED)
export const tokenInfoErr = APIError(APIErrorCause.TOKEN_INFO_FAILED)
export const stakesForAddressErr = APIError(
	APIErrorCause.STAKES_FOR_ADDRESS_FAILED,
)
export const unstakesForAddressErr = APIError(
	APIErrorCause.UNSTAKES_FOR_ADDRESS_FAILED,
)
export const txStatusErr = APIError(APIErrorCause.TX_STATUS_FAILED)
export const networkTxThroughputErr = APIError(
	APIErrorCause.NETWORK_TX_THROUGHPUT_FAILED,
)
export const networkTxDemandErr = APIError(
	APIErrorCause.NETWORK_TX_DEMAND_FAILED,
)
export const buildTxFromIntentErr = APIError(
	APIErrorCause.BUILD_TRANSACTION_FAILED,
)
export const submitSignedTxErr = APIError(APIErrorCause.SUBMIT_SIGNED_TX_FAILED)
export const networkIdErr = APIError(APIErrorCause.NETWORK_ID_FAILED)

export const lookupTxErr = APIError(APIErrorCause.LOOKUP_TX_FAILED)
export const validatorsErr = APIError(APIErrorCause.VALIDATORS_FAILED)

export const getNodeErr = nodeError(NodeErrorCause.GET_NODE_FAILED)

export const loadKeystoreErr = walletError(
	WalletErrorCause.LOAD_KEYSTORE_FAILED,
)
