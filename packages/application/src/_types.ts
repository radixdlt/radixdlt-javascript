import {
	SigningKeyT,
	AccountAddressT,
	DeriveNextInput,
	Signing,
	Encrypting,
	Decrypting,
	SwitchToIndex,
	AddSigningKeyByPrivateKeyInput,
	DeriveHWSigningKeyInput,
} from '@radixdlt/account'
import { PublicKeyT, HDPathRadixT, MnemomicT } from '@radixdlt/crypto'
import { Network } from '@radixdlt/primitives'
import { Observable, ReplaySubject } from 'rxjs'
import { BuiltTransaction } from './dto'
import {
	StakeTokensInput,
	TransferTokensInput,
	UnstakeTokensInput,
} from './actions'
import { Option } from 'prelude-ts'
import { SigningKeyTypeT } from '@radixdlt/account/src/_types'
import { Radix } from './radix'

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

		address: AccountAddressT

		// sugar for signingKey.publicKey/address.publicKey
		publicKey: PublicKeyT
		// sugar for address.network
		network: Network

		// sugar for `signingKey.type`
		type: SigningKeyTypeT

		// sugar for `signingKey.hdPath`, if signingKey type is HD signingKey
		hdPath?: HDPathRadixT
	}>

export type AccountsT = Readonly<{
	// Get only accounts which signingKey is a HD signingKey, by its path
	getAccountWithHDSigningKeyByHDPath: (
		hdPath: HDPathRadixT,
	) => Option<AccountT>
	// Get any account by its public key
	getAnyAccountByPublicKey: (publicKey: PublicKeyT) => Option<AccountT>

	// ALL accounts, basically a concatenation of `accountsWithHDSigningKeys || accountsWithNonHDSigningKeys`
	all: AccountT[]

	accountsWithNonHDSigningKeys: () => AccountT[]

	accountsWithLocalHDSigningKeys: () => AccountT[]
	accountsWithHardwareHDSigningKeys: () => AccountT[]

	// Concatenation of `accountsWithLocalHDSigningKeys || accountsWithHardwareHDSigningKeys`
	accountsWithHDSigningKeys: () => AccountT[]

	// size of `all`.
	size: () => number
}>

export type SwitchToAccount = Readonly<{ toAccount: AccountT }>

export type SwitchAccountInput =
	| 'first'
	| 'last'
	| SwitchToAccount
	| SwitchToIndex

export type WalletT = Readonly<{
	// should only be used for testing
	__unsafeGetAccount: () => AccountT

	revealMnemonic: () => MnemomicT

	restoreLocalHDAccountsToIndex: (index: number) => Observable<AccountsT>

	deriveNextLocalHDAccount: (input?: DeriveNextInput) => Observable<AccountT>

	deriveHWAccount: (input: DeriveHWSigningKeyInput) => Observable<AccountT>
	displayAddressForActiveHWAccountOnHWDeviceForVerification: () => Observable<void>

	addAccountFromPrivateKey: (
		input: AddAccountByPrivateKeyInput,
	) => Observable<AccountT>

	switchAccount: (input: SwitchAccountInput) => AccountT

	observeActiveAccount: () => Observable<AccountT>
	observeAccounts: () => Observable<AccountsT>
}>

export type AddAccountByPrivateKeyInput = AddSigningKeyByPrivateKeyInput

export type RadixT = ReturnType<typeof Radix.create>
