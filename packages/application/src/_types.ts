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

type NodeError = {
	tag: 'node'
	error: Error
}

type WalletError = {
	tag: 'wallet'
	error: Error
}

type APIError = {
	tag: 'api'
	error: Error
}

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
