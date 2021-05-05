import {
	SigningKeyT,
	AccountAddressT,
	DeriveNextInput,
	MnemomicT,
	NetworkT,
	HDPathRadixT,
	Signing,
	Encrypting,
	Decrypting,
	SwitchToIndex,
	WalletAddSigningKeyByPrivateKeyInput,
} from '@radixdlt/account'
import { KeystoreT, PrivateKey, PublicKey } from '@radixdlt/crypto'
import { LogLevel } from '@radixdlt/util'
import { Observable, ReplaySubject } from 'rxjs'
import { NodeT, RadixAPI, RadixCoreAPI } from './api'
import { ErrorNotification } from './errors'
import {
	StakePositions,
	StatusOfTransaction,
	TokenBalances,
	TransactionHistoryActiveSigningKeyRequestInput,
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

export type AccountT = Signing &
	Encrypting &
	Decrypting &
	Readonly<{
		equals: (other: AccountT) => boolean
		signingKey: SigningKeyT
		accountAddress: AccountAddressT

		// sugar for signingKey.publicKey/accountAddress.publicKey
		publicKey: PublicKey
		// sugar for accountAddress.network
		network: NetworkT

		// sugar for signingKey.hdPath, if signingKey type is HD signingKey
		hdPath?: HDPathRadixT
	}>

export type IdentitiesT = Readonly<{
	// Get only identities which signingKey is a HD signingKey, by its path
	getIdentityWithHDSigningKeyByHDPath: (
		hdPath: HDPathRadixT,
	) => Option<AccountT>
	// Get any account by its public key
	getAnyIdentityByPublicKey: (publicKey: PublicKey) => Option<AccountT>

	// ALL identities, basically a concatenation of `identitiesWithHDSigningKeys || identitiesWithNonHDSigningKeys`
	all: AccountT[]

	identitiesWithNonHDSigningKeys: () => AccountT[]

	identitiesWithLocalHDSigningKeys: () => AccountT[]
	identitiesWithHardwareHDSigningKeys: () => AccountT[]

	// Concatenation of `identitiesWithLocalHDSigningKeys || identitiesWithHardwareHDSigningKeys`
	identitiesWithHDSigningKeys: () => AccountT[]

	// size of `all`.
	size: () => number
}>

export type SwitchToIdentity = Readonly<{ toIdentity: AccountT }>

export type SwitchIdentityInput =
	| 'first'
	| 'last'
	| SwitchToIdentity
	| SwitchToIndex

export type WalletT = Readonly<{
	// should only be used for testing
	__unsafeGetIdentity: () => AccountT

	revealMnemonic: () => MnemomicT

	restoreIdentitiesForLocalHDSigningKeysUpToIndex: (
		index: number,
	) => Observable<IdentitiesT>

	deriveNextLocalHDIdentity: (
		input?: DeriveNextInput,
	) => Observable<AccountT>

	addIdentityFromPrivateKey: (
		input: AddIdentityByPrivateKeyInput,
	) => Observable<AccountT>

	switchIdentity: (input: SwitchIdentityInput) => AccountT

	observeActiveIdentity: () => Observable<AccountT>
	observeIdentities: () => Observable<IdentitiesT>
}>

export type AddIdentityByPrivateKeyInput = WalletAddSigningKeyByPrivateKeyInput

export type RadixT = Readonly<{
	ledger: RadixAPI
	// Input
	connect: (url: string) => RadixT

	// Primiarily useful for testing.
	__withAPI: (radixCoreAPI$: Observable<RadixCoreAPI>) => RadixT

	withNodeConnection: (node$: Observable<NodeT>) => RadixT
	withWallet: (wallet: WalletT) => RadixT
	login: (password: string, loadKeystore: () => Promise<KeystoreT>) => RadixT

	// SigningKeychain APIs

	/**
	 * Restores accounts in signingKeychain up to and excluding `targetIndex`.
	 *
	 * @param {number} targetIndex - The index to restore signingKey up to, this method will restore accounts from index 0 up to but excluding this index.
	 */
	restoreIdentitiesForLocalHDSigningKeysUpToIndex: (
		index: number,
	) => Observable<IdentitiesT>
	deriveNextIdentity: (input?: DeriveNextInput) => RadixT

	addIdentityFromPrivateKey: (input: AddIdentityByPrivateKeyInput) => RadixT

	switchIdentity: (input: SwitchIdentityInput) => RadixT
	revealMnemonic: () => Observable<MnemomicT>

	activeAddress: Observable<AccountAddressT>
	activeIdentity: Observable<AccountT>
	identities: Observable<IdentitiesT>

	// Active AccountAddress/SigningKey APIs
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
	 * Transaction history of active signingKey.
	 *
	 * @param {TransactionHistoryActiveSigningKeyRequestInput} input - Pagination input, size and cursor.
	 * @returns {TransactionHistory} A page from the transaction history.
	 */
	transactionHistory: (
		input: TransactionHistoryActiveSigningKeyRequestInput,
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

	__wallet: Observable<WalletT>
	__node: Observable<NodeT>
}>
