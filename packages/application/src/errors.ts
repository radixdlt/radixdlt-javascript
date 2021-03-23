type ErrorT<Category extends ErrorCategory> = {
	category: Category
	cause: ErrorCause
	message: string
}

export enum ErrorCategory {
	NODE = 'node',
	WALLET = 'wallet',
	API = 'api',
}

export enum ErrorCause {
	LOAD_KEYSTORE_FAILED = 'LOAD_KEYSTORE_FAILED',

	GET_NODE_FAILED = 'GET_NODE_FAILED',

	// API errors
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

type APIError = ErrorT<ErrorCategory.API>
type WalletError = ErrorT<ErrorCategory.WALLET>
type NodeError = ErrorT<ErrorCategory.NODE>

export type ErrorNotification = NodeError | WalletError | APIError

const Error = (category: ErrorCategory) => (cause: ErrorCause) => (
	message: string,
) => ({
	category,
	cause,
	message,
})

export const APIError = Error(ErrorCategory.API)
export const nodeError = Error(ErrorCategory.NODE)
export const walletError = Error(ErrorCategory.WALLET)

export const tokenBalancesErr = APIError(ErrorCause.TOKEN_BALANCES_FAILED)
export const executedTxErr = APIError(ErrorCause.EXECUTED_TX_FAILED)
export const nativeTokenErr = APIError(ErrorCause.NATIVE_TOKEN_FAILED)
export const tokenFeeErr = APIError(ErrorCause.TOKEN_FEE_FOR_TX_FAILED)
export const stakesForAddressErr = APIError(
	ErrorCause.STAKES_FOR_ADDRESS_FAILED,
)
export const txStatusErr = APIError(ErrorCause.TX_STATUS_FAILED)
export const networkTxThroughputErr = APIError(
	ErrorCause.NETWORK_TX_THROUGHPUT_FAILED,
)
export const networkTxDemandErr = APIError(ErrorCause.NETWORK_TX_DEMAND_FAILED)
export const getAtomForTxErr = APIError(ErrorCause.GET_ATOM_FOR_TX_FAILED)
export const submitSignedAtomErr = APIError(
	ErrorCause.SUBMIT_SIGNED_ATOM_FAILED,
)
export const magicErr = APIError(ErrorCause.MAGIC_FAILED)

export const getNodeErr = nodeError(ErrorCause.GET_NODE_FAILED)

export const loadKeystoreErr = walletError(ErrorCause.LOAD_KEYSTORE_FAILED)
