import { TokenDefinitionBase, TokenBase } from '@radixdlt/atom'
import { AddressT } from '@radixdlt/account'
import { AmountT } from '@radixdlt/primitives/src/_types'
import { ExecutedUserActionType, TokenTransfer } from './_types'

export const executedTokenTransfer = (
	input: Readonly<{
		from: AddressT
		to: AddressT
		amount: AmountT
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
