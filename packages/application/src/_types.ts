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
import {
	TokenBalances,
	TransactionHistory,
	TransactionHistoryActiveAccountRequestInput,
} from './dto/_types'

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

	/**
	 * Specify a trigger for when to fetch the token balances for the active address.
	 * 
	 * @param {Observable<number>} trigger - An observable that signals when to fetch.
	 */
	withTokenBalanceFetchTrigger: (trigger: Observable<number>) => RadixT

	/**
	 * Transaction history of active account.
	 *
	 * @param {TransactionHistoryActiveAccountRequestInput} input - Pagination input, size and cursor.
	 * @returns {TransactionHistory} A page from the transaction history.
	 */
	transactionHistory: (
		input: TransactionHistoryActiveAccountRequestInput,
	) => Observable<TransactionHistory>

	errors: Observable<ErrorNotification>

	__wallet: Observable<WalletT>
	__node: Observable<NodeT>
}>
