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
import { Observable } from 'rxjs'
import { NodeT, RadixAPI, RadixCoreAPI } from './api/_types'
import { ErrorNotification } from './errors'
import { TokenBalances } from './dto/_types'

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

	logLevel: (level: LogLevel) => RadixT

	withTokenBalanceFetchTrigger: (trigger: Observable<number>) => RadixT
	withTxHistoryFetchTrigger: (trigger: Observable<number>) => RadixT

	errors: Observable<ErrorNotification>

	__wallet: Observable<WalletT>
	__node: Observable<NodeT>
}>
