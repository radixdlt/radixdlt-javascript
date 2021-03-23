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
import { ErrorNotification } from './errors'

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

	errors: Observable<ErrorNotification>

	__wallet: Observable<WalletT>
	__node: Observable<NodeT>
}>
