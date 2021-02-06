import {
	AnyUpParticle,
	Atom,
	ResourceIdentifier,
	TokenBase,
	TokenDefinitionBase,
} from '@radixdlt/atom'
import { Address } from '@radixdlt/crypto'
import { Amount } from '@radixdlt/primitives'
import { Result } from 'neverthrow'
import { Observable } from 'rxjs'

export type TokenDefinition = TokenDefinitionBase &
	Readonly<{
		/// For MutableSupplyTokens the `supply` fields needs to be calculated by reducing state.
		supply?: Amount
	}>

export type TokenAmount = Readonly<{
	amount: Amount
	token: TokenBase | TokenDefinition
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

export type TokenBalance = Readonly<{
	owner: Address
	tokenAmount: TokenAmount
}>

export enum ApplicationStateType {
	TOKEN_BALANCES = 'TokenBalances',
}
export type ApplicationState = Readonly<{
	stateType: ApplicationStateType
}>

export type TokenBalancesState = ApplicationState &
	Readonly<{
		balances: Map<ResourceIdentifier, TokenBalance>
		balanceOf: (
			resourceIdentifier: ResourceIdentifier,
		) => TokenBalance | undefined
	}>

export type ParticleReducer<S extends ApplicationState> = Readonly<{
	applicationStateType: ApplicationStateType
	initialState: S
	reduce: (state: S, upParticle: AnyUpParticle) => S
	combine: (s0: S, s1: S) => S
	reduceFromInitialState: (upParticles: AnyUpParticle[]) => Result<S, Error>
}>

export type TokenBalanceReducer = ParticleReducer<TokenBalancesState> &
	Readonly<{
		applicationStateType: ApplicationStateType.TOKEN_BALANCES
	}>

export type AtomToActionMapperInput = Readonly<{
	atom: Atom
	addressOfActiveAccount: Address
}>

export type AtomToExecutedActionsMapper<
	A extends ExecutedUserAction
> = Readonly<{
	executedUserActionType: ExecutedUserActionType

	// Observable<T> map(Atom a, RadixIdentity identity);
	map: (input: AtomToActionMapperInput) => Observable<A>
}>

export type AtomToTokenTransfersMapper = AtomToExecutedActionsMapper<TokenTransfer>
