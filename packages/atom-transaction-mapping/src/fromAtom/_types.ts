import {
	AnyUpParticle,
	Atom,
	ResourceIdentifier,
	TokenBase,
	TokenDefinitionBase,
} from '@radixdlt/atom'
import { Address } from '@radixdlt/account'
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
	TOKEN_BALANCES_FOR_ONE_ACCOUNT = 'TokenBalancesForOneAccount',
	TOKEN_BALANCES_PER_ACCOUNT = 'TokenBalancesPerAccount',
}
export type ApplicationState = Readonly<{
	stateType: ApplicationStateType
}>

export type TokenBalancesForOneAccount = ApplicationState &
	Readonly<{
		balances: Map<ResourceIdentifier, TokenBalance>
		owner: Address
		size: number
		balanceOf: (
			resourceIdentifier: ResourceIdentifier,
		) => TokenBalance | undefined
	}>

export type TokenBalancesPerAccount = ApplicationState &
	Readonly<{
		balances: Map<Address, TokenBalancesForOneAccount>
		size: number
		balancesFor: (owner: Address) => TokenBalancesForOneAccount
	}>

export type ParticleReducer<S extends ApplicationState> = Readonly<{
	applicationStateType: ApplicationStateType
	initialState: S
	reduce: (
		input: Readonly<{ state: S; upParticle: AnyUpParticle }>,
	) => Result<S, Error>
	combine: (input: Readonly<{ current: S; newState: S }>) => Result<S, Error>
	reduceFromInitialState: (upParticles: AnyUpParticle[]) => Result<S, Error>
}>

export type TokenBalancesForOneAccountReducer = ParticleReducer<TokenBalancesForOneAccount> &
	Readonly<{
		applicationStateType: ApplicationStateType.TOKEN_BALANCES_FOR_ONE_ACCOUNT
	}>

export type TokenBalancesPerAccountReducer = ParticleReducer<TokenBalancesPerAccount> &
	Readonly<{
		applicationStateType: ApplicationStateType.TOKEN_BALANCES_PER_ACCOUNT
	}>

export type AtomToActionMapperInput = Readonly<{
	atom: Atom
	addressOfActiveAccount: Address
}>

export type AtomToExecutedActionsMapper<
	A extends ExecutedUserAction
> = Readonly<{
	executedUserActionType: ExecutedUserActionType
	map: (input: AtomToActionMapperInput) => Observable<A>
}>

export type AtomToTokenTransfersMapper = AtomToExecutedActionsMapper<TokenTransfer>
