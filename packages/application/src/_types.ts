import {
	AccountsT,
	AccountT,
	AddressT,
	DeriveNextAccountInput,
	SwitchAccountInput,
	WalletT,
} from '@radixdlt/account'
import { Observable } from 'packages/account/node_modules/rxjs/dist/types'
import { KeystoreT } from 'packages/crypto/src/keystore/_types'
import { NodeT, RadixAPI, RadixCoreAPI, TokenBalances } from './api/_types'

type ErrorT<T extends ErrorTag> = {
	tag: T
	error: Error
}

export enum ErrorTag {
	NODE = 'node',
	WALLET = 'wallet',
	API = 'api',
}

type APIError = ErrorT<ErrorTag.API>
type WalletError = ErrorT<ErrorTag.WALLET>
type NodeError = ErrorT<ErrorTag.NODE>

export type ErrorNotification = NodeError | WalletError | APIError

export type RadixT = Readonly<{
	api: RadixAPI
	// Input
	connect: (url: URL) => RadixT

	// Primiarily useful for testing.
	__withAPI: (radixCoreAPI$: Observable<RadixCoreAPI>) => RadixT

	withNodeConnection: (node$: Observable<NodeT>) => RadixT
	withWallet: (wallet: WalletT) => RadixT
	login: (password: string, loadKeystore: () => Promise<KeystoreT>) => RadixT

	// Observe Input
	wallet: Observable<WalletT>
	node: Observable<NodeT>

	// Wallet APIs
	deriveNextAccount: (input?: DeriveNextAccountInput) => RadixT
	switchAccount: (input: SwitchAccountInput) => RadixT

	activeAddress: Observable<AddressT>
	activeAccount: Observable<AccountT>
	accounts: Observable<AccountsT>

	// Active Address/Account APIs
	tokenBalances: Observable<TokenBalances>

	errors: Observable<ErrorNotification>
}>
