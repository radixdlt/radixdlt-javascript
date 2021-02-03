import { Atom, TokenDefinitionBase } from '@radixdlt/atom'
import { Address } from '@radixdlt/crypto'
import { Amount } from '@radixdlt/primitives'
import { Observable } from 'rxjs'

export type TokenDefinition = TokenDefinitionBase &
	Readonly<{
		/// For MutableSupplyTokens the `supply` fields needs to be calculated by reducing state.
		supply: Amount
	}>

export type TokenAmount = Readonly<{
	amount: Amount
	token: TokenDefinition
}>

export enum ExecutedUserActionType {
	TOKEN_TRANSFER = 'TokenTransfer',
}

export type ExecutedUserAction = Readonly<{
	executedUserActionType: ExecutedUserActionType
}>

export type TokenTransfer = ExecutedUserAction &
	Readonly<{
		from: Address
		to: Address
		tokenAmount: TokenAmount
	}>

export type AtomToExecutedActionsMapper<
	A extends ExecutedUserAction
> = Readonly<{
	executedUserActionType: ExecutedUserActionType

	// Observable<T> map(Atom a, RadixIdentity identity);
	map: (
		input: Readonly<{
			atom: Atom
			addressOfActiveAccount: Address
		}>,
	) => Observable<A>
}>

export type AtomToTokenTransfersMapper = AtomToExecutedActionsMapper<TokenTransfer>
