import { TokenDefinitionBase, TokenBase } from '@radixdlt/atom'
import { Address } from '@radixdlt/account'
import { Amount } from '@radixdlt/primitives'
import { ExecutedUserActionType, TokenTransfer } from './_types'

export const executedTokenTransfer = (
	input: Readonly<{
		from: Address
		to: Address
		amount: Amount
		tokenDefinition: TokenBase | TokenDefinitionBase
	}>,
): TokenTransfer => ({
	from: input.from,
	to: input.to,
	tokenAmount: {
		amount: input.amount,
		token: input.tokenDefinition,
	},
	executedUserActionType: ExecutedUserActionType.TOKEN_TRANSFER,
})
