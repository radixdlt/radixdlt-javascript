import {
	AccountAddressT,
	ResourceIdentifierT,
	ValidatorAddressT,
} from '@radixdlt/account'
import {
	LedgerState as LedgerStateRaw,
	NetworkPostRequest,
	NetworkResponse,
	TokenPostRequest,
	TokenResponse,
	TokenNativePostRequest,
	TokenNativeResponse,
	TokenDerivePostRequest,
	TokenDeriveResponse,
	AccountBalancesPostRequest,
	AccountBalancesResponse,
	AccountStakesPostRequest,
	AccountStakesResponse,
	AccountUnstakesPostRequest,
	AccountUnstakesResponse,
	AccountTransactionsPostRequest,
	AccountTransactionsResponse,
	AccountTransactionStatusStatusEnum,
	ValidatorPostRequest,
	ValidatorsResponse,
	ValidatorUptime,
	ValidatorInfoResponse,
	ValidatorsPostRequest,
	TransactionRulesResponse,
	TransactionBuildResponse,
	TransactionFinalizePostRequest,
	TransactionFinalizeResponse,
	TransactionSubmitPostRequest,
	TransactionSubmitResponse,
	TransactionStatusPostRequest,
	TransactionStatusResponse,
	TransactionRulesPostRequest,
	TransactionBuildPostRequest,
} from '@radixdlt/networking'
import { AmountT, Network } from '@radixdlt/primitives'
import { TransactionIdentifierT } from '../../dto'

namespace Decoded {
	export type TokenIdentifier = {
		rri: ResourceIdentifierT
	}

	export type TokenAmount = {
		value: AmountT
		token_identifier: TokenIdentifier
	}

	export type AccountIdentifier = {
		address: AccountAddressT
	}

	export type TokenProperties = {
		name?: string
		description?: string
		icon_url?: URL
		symbol: string
		is_supply_mutable: boolean
		granularity: AmountT
		owner: AccountIdentifier
	}

	export type TokenInfo = {
		total_minted: TokenAmount
		total_burned: TokenAmount
	}

	export type Token = {
		token_identifier: TokenIdentifier
		token_supply: TokenAmount
		info: TokenInfo
		token_properties: TokenProperties
	}

	export type LedgerState = LedgerStateRaw & { timestamp: Date }

	export type ValidatorIdentifier = {
		address: ValidatorAddressT
	}

	export type AccountTransactionStatus = {
		status: AccountTransactionStatusStatusEnum
		confirmed_time?: Date
	}

	export type TransactionIdentifier = {
		hash: TransactionIdentifierT
	}

	export type AccountBalances = {
		staked_and_unstaking_balance: TokenAmount
		liquid_balances: TokenAmount
	}

	export type AccountStakeEntry = {
		validator_identifier: ValidatorIdentifier
		delegated_stake: TokenAmount
	}

	export type AccountUnstakeEntry = {
		validator_identifier: ValidatorIdentifier
		unstaking_amount: TokenAmount
		epochs_until_unlocked: number
	}

	export type ValidatorInfo = {
		owner_stake: TokenAmount
		uptime: ValidatorUptime
	}

	export type ValidatorProperties = {
		url: URL
		validator_fee: string
		name: string
		registered: boolean
		owner_account_identifier: AccountIdentifier
	}

	export type Validator = {
		validator_identifier: ValidatorIdentifier
		stake: Decoded.TokenAmount
		info: ValidatorInfo
		properties: ValidatorProperties
	}

	export type TransferTokensAction = {
		type: 'TransferTokens'
		from: AccountIdentifier
		to: AccountIdentifier
		amount: TokenAmount
	}

	export type StakeTokensAction = {
		type: 'StakeTokens'
		from?: AccountIdentifier
		to?: AccountIdentifier
		amount?: TokenAmount
	}

	export type UnstakeTokensAction = {
		type: 'UnstakeTokens'
		from: ValidatorIdentifier
		to: AccountIdentifier
		amount: TokenAmount
	}

	export type MintTokensAction = {
		type: 'MintTokens'
		to: ValidatorIdentifier
		amount: TokenAmount
	}

	export type BurnTokensAction = {
		type: 'BurnTokens'
		from: ValidatorIdentifier
		amount: TokenAmount
	}

	export type CreateTokenDefinitionAction = {
		type: 'CreateTokenDefinition'
		token_properties: TokenProperties
		token_supply: TokenAmount
		to?: AccountIdentifier
	}

	export type Action =
		| TransferTokensAction
		| StakeTokensAction
		| UnstakeTokensAction
		| MintTokensAction
		| BurnTokensAction
		| CreateTokenDefinitionAction

	export type AccountTransaction = {
		transaction_status: AccountTransactionStatus
		transaction_identifier: TransactionIdentifier
		actions: Action[]
		fee_paid: TokenAmount
		metadata: {
			hex: string
			message?: string
		}
	}

	export type TransactionRules = {
		maximum_message_length: number
		minimum_stake: Decoded.TokenAmount
	}

	export type TransactionBuild = {
		fee: Decoded.TokenAmount
		unsigned_transaction: string
		payload_to_sign: string
	}

	export type NotEnoughResourcesError = {
		type: 'NotEnoughResourcesError'
		requested_amount: AmountT
		available_amount: AmountT
	}

	export type BelowMinimumStakeError = {
		type: 'BelowMinimumStakeError'
		requested_amount: AmountT
		minimum_amount: AmountT
	}

	export type NotValidatorOwnerError = {
		type: 'NotValidatorOwnerError'
		owner: Decoded.AccountIdentifier
		user: Decoded.AccountIdentifier
	}

	export type MessageTooLongError = {
		type: 'MessageTooLongError'
		length_limit: number
		attempted_length: number
	}

	export type CouldNotConstructFeesError = {
		type: 'CouldNotConstructFeesError'
		attempts: number
	}

	export type TransactionBuildError =
		| NotEnoughResourcesError
		| BelowMinimumStakeError
		| NotValidatorOwnerError
		| MessageTooLongError
		| CouldNotConstructFeesError
}

export namespace NetworkEndpoint {
	export type Input = NetworkPostRequest

	export type Response = NetworkResponse

	export type DecodedResponse = {
		ledger_state: Decoded.LedgerState
		network: Network
	}
}

export namespace TokenInfoEndpoint {
	export type Input = TokenPostRequest

	export type Response = TokenResponse

	export type DecodedResponse = {
		ledger_state: Decoded.LedgerState
		token: Decoded.Token[]
	}
}

export namespace NativeTokenInfoEndpoint {
	export type Input = TokenNativePostRequest

	export type Response = TokenNativeResponse

	export type DecodedResponse = {
		ledger_state: Decoded.LedgerState
		token: Decoded.Token[]
	}
}

export namespace DeriveTokenIdentifierEndpoint {
	export type Input = TokenDerivePostRequest

	export type Response = TokenDeriveResponse

	export type DecodedResponse = {
		ledger_state: Decoded.LedgerState
		creator_account_identifier: Decoded.AccountIdentifier
		symbol: string
	}
}

export namespace AccountBalancesEndpoint {
	export type Input = AccountBalancesPostRequest

	export type Response = AccountBalancesResponse

	export type DecodedResponse = {
		ledger_state: Decoded.LedgerState
		account_balances: Decoded.AccountBalances
	}
}

export namespace StakePositionsEndpoint {
	export type Input = AccountStakesPostRequest
	export type Response = AccountStakesResponse
	export type DecodedResponse = {
		ledger_state: Decoded.LedgerState
		stakes: Decoded.AccountStakeEntry[]
	}
}

export namespace UnstakePositionsEndpoint {
	export type Input = AccountUnstakesPostRequest
	export type Response = AccountUnstakesResponse
	export type DecodedResponse = {
		ledger_state: Decoded.LedgerState
		unstakes: Decoded.AccountUnstakeEntry[]
	}
}

export namespace AccountTransactionsEndpoint {
	export type Input = AccountTransactionsPostRequest
	export type Response = AccountTransactionsResponse
	export type DecodedResponse = {
		ledger_state: Decoded.LedgerState
		total_count: number
		next_cursor: string
		transactions: Decoded.AccountTransaction[]
	}
}

export namespace ValidatorEndpoint {
	export type Input = ValidatorPostRequest
	export type Response = ValidatorInfoResponse
	export type DecodedResponse = {
		ledger_state: Decoded.LedgerState
		validator: Decoded.Validator
	}
}

export namespace ValidatorsEndpoint {
	export type Input = ValidatorsPostRequest
	export type Response = ValidatorsResponse
	export type DecodedResponse = {
		ledger_state: Decoded.LedgerState
		validators: Decoded.Validator[]
	}
}

export namespace TransactionRulesEndpoint {
	export type Input = TransactionRulesPostRequest
	export type Response = TransactionRulesResponse
	export type DecodedResponse = {
		ledger_state: Decoded.LedgerState
		transaction_rules: Decoded.TransactionRules
	}
}
export namespace BuildTransactionEndpoint {
	export type Input = TransactionBuildPostRequest
	export type Response = TransactionBuildResponse
}

export namespace FinalizeTransactionEndpoint {
	export type Input = TransactionFinalizePostRequest
	export type Response = TransactionFinalizeResponse
	export type DecodedResponse = {
		signed_transaction: string
	}
}

export namespace SubmitTransactionEndpoint {
	export type Input = TransactionSubmitPostRequest
	export type Response = TransactionSubmitResponse
	export type DecodedResponse = {
		transaction_identifier: Decoded.TransactionIdentifier
	}
}

export namespace TransactionEndpoint {
	export type Input = TransactionStatusPostRequest
	export type Response = TransactionStatusResponse
	export type DecodedResponse = {
		ledger_state: Decoded.LedgerState
		transaction: Decoded.AccountTransaction[]
	}
}
