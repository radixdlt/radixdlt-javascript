import {
	AccountsT,
	AccountT,
	AccountAddressT,
	DeriveNextAccountInput,
	MnemomicT,
	SwitchAccountInput,
	WalletT,
} from '@radixdlt/account'
import { KeystoreT } from '@radixdlt/crypto'
import { RadixLogLevel } from '@radixdlt/util'
import { Observable, ReplaySubject } from 'rxjs'
import { NodeT, RadixAPI, RadixCoreAPI } from './api'
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
	BuiltTransaction,
	ExecutedTransaction,
} from './dto'
import {
	StakeTokensInput,
	TransferTokensInput,
	UnstakeTokensInput,
} from './actions'

export type ManualUserConfirmTX = {
	txToConfirm: BuiltTransaction
	confirm: () => void
}

export type TransactionConfirmationBeforeFinalization =
	| 'skip'
	| ReplaySubject<ManualUserConfirmTX>

export type MessageInTransaction = Readonly<{
	plaintext: string
	encrypt: boolean
}>

export type MakeTransactionOptions = Readonly<{
	message?: MessageInTransaction
	userConfirmation: TransactionConfirmationBeforeFinalization
	pollTXStatusTrigger?: Observable<unknown>
}>

export type TransferTokensOptions = MakeTransactionOptions &
	Readonly<{
		transferInput: TransferTokensInput
	}>

export type StakeOptions = MakeTransactionOptions &
	Readonly<{
		stakeInput: StakeTokensInput
	}>

export type UnstakeOptions = MakeTransactionOptions &
	Readonly<{
		unstakeInput: UnstakeTokensInput
	}>

export type RadixT = Readonly<{
	ledger: RadixAPI
	// Input
	connect: (url: string) => RadixT

	// Primiarily useful for testing.
	__withAPI: (radixCoreAPI$: Observable<RadixCoreAPI>) => RadixT

	withNodeConnection: (node$: Observable<NodeT>) => RadixT
	withWallet: (wallet: WalletT) => RadixT
	login: (password: string, loadKeystore: () => Promise<KeystoreT>) => RadixT

	// Wallet APIs
	deriveNextAccount: (input?: DeriveNextAccountInput) => RadixT
	switchAccount: (input: SwitchAccountInput) => RadixT
	revealMnemonic: () => Observable<MnemomicT>

	activeAddress: Observable<AccountAddressT>
	activeAccount: Observable<AccountT>
	accounts: Observable<AccountsT>

	// Active AccountAddress/Account APIs
	tokenBalances: Observable<TokenBalances>
	stakingPositions: Observable<StakePositions>
	unstakingPositions: Observable<UnstakePositions>

	logLevel: (level: RadixLogLevel | 'silent') => RadixT

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

	stakeTokens: (input: StakeOptions) => TransactionTracking

	unstakeTokens: (input: UnstakeOptions) => TransactionTracking

	decryptTransaction: (input: ExecutedTransaction) => Observable<string>

	errors: Observable<ErrorNotification>

	__wallet: Observable<WalletT>
	__node: Observable<NodeT>
}>
