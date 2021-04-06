import {
	AccountsT,
	AccountT,
	AddressT,
	DeriveNextAccountInput,
	SwitchAccountInput,
	WalletT,
} from '@radixdlt/account'
import { KeystoreT } from '@radixdlt/crypto'
import { LogLevel } from '@radixdlt/util'
import { Observable, Subject } from 'rxjs'
import { NodeT, RadixAPI, RadixCoreAPI } from './api/_types'
import { ErrorNotification } from './errors'
import {
	StakePositions,
	StatusOfTransaction,
	TokenBalances,
	TransactionHistory,
	TransactionHistoryActiveAccountRequestInput,
	UnstakePositions,
	TransactionIdentifierT,
	TransactionTracking,
	SignedUnconfirmedTransaction,
} from './dto/_types'
import { TransferTokensInput } from './actions/_types'

export type ManualUserConfirmTX = {
	txToConfirm: SignedUnconfirmedTransaction
	userDidConfirmSubject: Subject<SignedUnconfirmedTransaction>
}

export type TransactionConfirmationBeforeFinalization =
	| 'automaticallyConfirmTransaction'
	| Subject<ManualUserConfirmTX>

export type MakeTransactionOptions = Readonly<{
	txConfirmationBeforeFinalization: TransactionConfirmationBeforeFinalization
	pollTXStatusTrigger?: Observable<unknown>
}>

export type TransferTokensOptions = MakeTransactionOptions &
	Readonly<{
		transferInput: TransferTokensInput
	}>

export type RadixT = Readonly<{
	ledger: RadixAPI
	// Input
	connect: (url: URL) => RadixT

	// Primiarily useful for testing.
	__withAPI: (radixCoreAPI$: Observable<RadixCoreAPI>) => RadixT

	withNodeConnection: (node$: Observable<NodeT>) => RadixT
	withWallet: (wallet: WalletT) => RadixT
	login: (password: string, loadKeystore: () => Promise<KeystoreT>) => RadixT

	// Wallet APIs
	deriveNextAccount: (input?: DeriveNextAccountInput) => RadixT
	switchAccount: (input: SwitchAccountInput) => RadixT

	activeAddress: Observable<AddressT>
	activeAccount: Observable<AccountT>
	accounts: Observable<AccountsT>

	// Active Address/Account APIs
	tokenBalances: Observable<TokenBalances>
	stakingPositions: Observable<StakePositions>
	unstakingPositions: Observable<UnstakePositions>

	logLevel: (level: LogLevel) => RadixT

	/**
	 * Specify a trigger for when to fetch the token balances for the active address.
	 *
	 * @param {Observable<number>} trigger - An observable that signals when to fetch.
	 */
	withTokenBalanceFetchTrigger: (trigger: Observable<number>) => RadixT

	/**
	 * Specify a trigger for when to fetch the stakes and unstakes for the active address.
	 *
	 * @param {Observable<number>} trigger - An observable that signals when to fetch.
	 */
	withStakingFetchTrigger: (trigger: Observable<number>) => RadixT

	/**
	 * Transaction history of active account.
	 *
	 * @param {TransactionHistoryActiveAccountRequestInput} input - Pagination input, size and cursor.
	 * @returns {TransactionHistory} A page from the transaction history.
	 */
	transactionHistory: (
		input: TransactionHistoryActiveAccountRequestInput,
	) => Observable<TransactionHistory>

	// Make TX flow
	transferTokens: (input: TransferTokensOptions) => TransactionTracking

	transactionStatus: (
		txID: TransactionIdentifierT,
		trigger: Observable<number>,
	) => Observable<StatusOfTransaction>

	errors: Observable<ErrorNotification>

	__wallet: Observable<WalletT>
	__node: Observable<NodeT>
}>
