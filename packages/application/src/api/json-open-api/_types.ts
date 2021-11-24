import {
	LedgerState,
	NetworkPostRequest,
	NetworkResponse,
} from '@radixdlt/networking'
import { Network } from '@radixdlt/primitives'

export enum ApiMethod {
	NETWORK = 'networkPost',
	// TOKEN_BALANCES = 'account.get_balances',
	// TRANSACTION_HISTORY = 'account.get_transaction_history',
	// STAKES = 'account.get_stake_positions',
	// UNSTAKES = 'account.get_unstake_positions',
	// TX_STATUS = 'transactions.get_transaction_status',
	// NETWORK_TX_THROUGHPUT = 'network.get_throughput',
	// NETWORK_TX_DEMAND = 'network.get_demand',
	// VALIDATORS = 'validators.get_next_epoch_set',
	// LOOKUP_TX = 'transactions.lookup_transaction',
	// LOOKUP_VALIDATOR = 'validators.lookup_validator',
	// NATIVE_TOKEN = 'tokens.get_native_token',
	// TOKEN_INFO = 'tokens.get_info',
	// BUILD_TX_FROM_INTENT = 'construction.build_transaction',
	// SUBMIT_TX = 'construction.submit_transaction',
	// FINALIZE_TX = 'construction.finalize_transaction',
}

export namespace NetworkEndpoint {
	export type Input = NetworkPostRequest

	export type Response = NetworkResponse

	export type DecodedResponse = {
		network: Network
		ledger_state: LedgerState
	}
}
