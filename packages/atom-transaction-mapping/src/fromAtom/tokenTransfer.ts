import { TokenDefinitionBase, TokenBase } from '@radixdlt/atom'
import { Address } from '@radixdlt/crypto'
import { Amount } from '@radixdlt/primitives'
import { ExecutedUserActionType, TokenTransfer, TokenAmount } from './_types'

export const executedTokenTransfer = (
	input: Readonly<{
		from: Address
		to: Address
		amount: Amount
		tokenDefinition: TokenBase | TokenDefinitionBase
	}>,
): TokenTransfer => ({
	...input,
	tokenAmount: <TokenAmount>{
		amount: input.amount,
		token: input.tokenDefinition,
	},
	executedUserActionType: ExecutedUserActionType.TOKEN_TRANSFER,
})
