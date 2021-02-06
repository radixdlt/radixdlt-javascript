import { AnyUpParticle } from '@radixdlt/atom'
import {
	ApplicationState,
	ApplicationStateType,
	ParticleReducer,
} from './_types'

const reduceListWithReducer = <S extends ApplicationState>(
	reducer: ParticleReducer<S>,
) => (state: S, upParticle: AnyUpParticle): S =>
	reducer.reduce({ state, upParticle })

export const reduceFromInitialState = <S extends ApplicationState>(
	upParticles: AnyUpParticle[],
	reducer: ParticleReducer<S>,
): S => upParticles.reduce(reduceListWithReducer(reducer), reducer.initialState)

export const makeParticleReducer = <
	S extends ApplicationState,
	R extends ParticleReducer<S>
>(
	input: Readonly<{
		applicationStateType: ApplicationStateType
		initialState: S
		reduce: (input: Readonly<{ state: S; upParticle: AnyUpParticle }>) => S
		combine: (input: Readonly<{ current: S; newState: S }>) => S
	}>,
): R => {
	if (input.applicationStateType !== input.initialState.stateType)
		throw new Error(
			'Incorrect implementation, mismatch between application state types.',
		)

	const particleReducer = {
		...input,
		reduceFromInitialState: (_: AnyUpParticle[]) => {
			throw new Error('Impl me')
		},
	}

	return <R>{
		...particleReducer,
		reduceFromInitialState: (upPartilces: AnyUpParticle[]) =>
			reduceFromInitialState(upPartilces, particleReducer),
	}
}
