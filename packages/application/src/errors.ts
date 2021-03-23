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
	EXECUTED_TX_FAILED = 'EXECUTED_TX_FAILED',
	NATIVE_TOKEN_FAILED = 'NATIVE_TOKEN_FAILED',
	TOKEN_FEE_FOR_TX_FAILED = 'TOKEN_FEE_FOR_TX_FAILED',
	STAKES_FOR_ADDRESS_FAILED = 'STAKES_FOR_ADDRESS_FAILED',
	TX_STATUS_FAILED = 'TX_STATUS_FAILED',
	NETWORK_TX_THROUGHPUT_FAILED = 'NETWORK_TX_THROUGHPUT_FAILED',
	NETWORK_TX_DEMAND_FAILED = 'NETWORK_TX_DEMAND_FAILED',
	GET_ATOM_FOR_TX_FAILED = 'GET_ATOM_FOR_TX_FAILED',
	SUBMIT_SIGNED_ATOM_FAILED = 'SUBMIT_SIGNED_ATOM_FAILED',
	MAGIC_FAILED = 'MAGIC_FAILED',
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
export const executedTxErr = APIError(APIErrorCause.EXECUTED_TX_FAILED)
export const nativeTokenErr = APIError(APIErrorCause.NATIVE_TOKEN_FAILED)
export const tokenFeeErr = APIError(APIErrorCause.TOKEN_FEE_FOR_TX_FAILED)
export const stakesForAddressErr = APIError(
	APIErrorCause.STAKES_FOR_ADDRESS_FAILED,
)
export const txStatusErr = APIError(APIErrorCause.TX_STATUS_FAILED)
export const networkTxThroughputErr = APIError(
	APIErrorCause.NETWORK_TX_THROUGHPUT_FAILED,
)
export const networkTxDemandErr = APIError(
	APIErrorCause.NETWORK_TX_DEMAND_FAILED,
)
export const getAtomForTxErr = APIError(APIErrorCause.GET_ATOM_FOR_TX_FAILED)
export const submitSignedAtomErr = APIError(
	APIErrorCause.SUBMIT_SIGNED_ATOM_FAILED,
)
export const magicErr = APIError(APIErrorCause.MAGIC_FAILED)

export const getNodeErr = nodeError(NodeErrorCause.GET_NODE_FAILED)

export const loadKeystoreErr = walletError(
	WalletErrorCause.LOAD_KEYSTORE_FAILED,
)
