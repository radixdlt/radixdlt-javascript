import {
	AccountsT,
	AccountT,
	AccountAddressT,
	DeriveNextAccountInput,
	MnemomicT,
	SwitchAccountInput,
	WalletT,
	NetworkT,
	HDPathRadixT,
	Signing,
	Encrypting,
	Decrypting,
} from '@radixdlt/account'
import { KeystoreT, PublicKey } from '@radixdlt/crypto'
import { LogLevel } from '@radixdlt/util'
import { Observable, ReplaySubject } from 'rxjs'
import { NodeT, RadixAPI, RadixCoreAPI } from './api'
import { ErrorNotification } from './errors'
import {
	StakePositions,
	StatusOfTransaction,
	TokenBalances,
	TransactionHistoryActiveAccountRequestInput,
	UnstakePositions,
	TransactionIdentifierT,
	TransactionTracking,
	BuiltTransaction,
	SimpleExecutedTransaction,
	TransactionHistory,
	ExecutedTransaction,
} from './dto'
import {
	StakeTokensInput,
	TransferTokensInput,
	UnstakeTokensInput,
} from './actions'
import { Option } from 'prelude-ts'

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
	userConfirmation: TransactionConfirmationBeforeFinalization
	pollTXStatusTrigger?: Observable<unknown>
}>

export type TransferTokensOptions = MakeTransactionOptions &
	Readonly<{
		message?: MessageInTransaction
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

export type IdentityT = Signing &
	Encrypting &
	Decrypting &
	Readonly<{
		equals: (other: IdentityT) => boolean
		account: AccountT
		accountAddress: AccountAddressT

		// sugar for account.publicKey/accountAddress.publicKey
		publicKey: PublicKey
		// sugar for accountAddress.network
		network: NetworkT

		// sugar for account.hdPath, if account type is HD account
		hdPath?: HDPathRadixT
	}>

export type IdentitiesT = Readonly<{
	// Get only identities which account is a HD account, by its path
	getIdentityWithHDAccountByHDPath: (
		hdPath: HDPathRadixT,
	) => Option<IdentityT>
	// Get any identity by its public key
	getAnyIdentityByPublicKey: (publicKey: PublicKey) => Option<IdentityT>

	// ALL identities, basically a concatenation of `identitiesWithHDAccounts || identitiesWithNonHDAccounts`
	all: IdentityT[]

	identitiesWithNonHDAccounts: () => IdentityT[]

	identitiesWithLocalHDAccounts: () => IdentityT[]
	identitiesWithHardwareHDAccounts: () => IdentityT[]

	// Concatenation of `identitiesWithLocalHDAccounts || identitiesWithHardwareHDAccounts`
	identitiesWithHDAccounts: () => IdentityT[]

	// size of `all`.
	size: () => number
}>

export type IdentityManagerT = Readonly<{
	// should only be used for testing
	__unsafeGetIdentity: () => IdentityT

	revealMnemonic: () => MnemomicT

	restoreIdentitiesForLocalHDAccountsUpToIndex: (
		index: number,
	) => Observable<IdentitiesT>

	deriveNextLocalHDIdentity: (
		input?: DeriveNextAccountInput,
	) => Observable<IdentityT>

	switchIdentity: (input: SwitchAccountInput) => IdentityT

	observeActiveIdentity: () => Observable<IdentityT>
	observeIdentities: () => Observable<IdentitiesT>
}>

export type RadixT = Readonly<{
	ledger: RadixAPI
	// Input
	connect: (url: string) => RadixT

	// Primiarily useful for testing.
	__withAPI: (radixCoreAPI$: Observable<RadixCoreAPI>) => RadixT

	withNodeConnection: (node$: Observable<NodeT>) => RadixT
	withIdentityManager: (identityManager: IdentityManagerT) => RadixT
	login: (password: string, loadKeystore: () => Promise<KeystoreT>) => RadixT

	// Wallet APIs

	/**
	 * Restores accounts in wallet up to and excluding `targetIndex`.
	 *
	 * @param {number} targetIndex - The index to restore account up to, this method will restore accounts from index 0 up to but excluding this index.
	 */
	restoreIdentitiesForLocalHDAccountsUpToIndex: (
		index: number,
	) => Observable<IdentitiesT>
	deriveNextIdentity: (input?: DeriveNextAccountInput) => RadixT
	switchIdentity: (input: SwitchAccountInput) => RadixT
	revealMnemonic: () => Observable<MnemomicT>

	activeAddress: Observable<AccountAddressT>
	activeIdentity: Observable<IdentityT>
	identities: Observable<IdentitiesT>

	// Active AccountAddress/Account APIs
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

	/**
	 * A decorated variant of RadixApi's lookupTransaction, this decorated variant returns
	 * `ExecutedTransaction` instead of `SimpleExecutedTransaction` which includes `transctionType`.
	 */
	lookupTransaction: (
		txID: TransactionIdentifierT,
	) => Observable<ExecutedTransaction>

	// Make TX flow
	transferTokens: (input: TransferTokensOptions) => TransactionTracking

	transactionStatus: (
		txID: TransactionIdentifierT,
		trigger: Observable<number>,
	) => Observable<StatusOfTransaction>

	stakeTokens: (input: StakeOptions) => TransactionTracking

	unstakeTokens: (input: UnstakeOptions) => TransactionTracking

	decryptTransaction: (input: SimpleExecutedTransaction) => Observable<string>

	errors: Observable<ErrorNotification>

	__identityManager: Observable<IdentityManagerT>
	__node: Observable<NodeT>
}>
