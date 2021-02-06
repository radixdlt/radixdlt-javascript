import { AnyUpParticle } from '@radixdlt/atom'
import { ok, Result } from 'neverthrow'
import {
	ApplicationState,
	ApplicationStateType,
	ParticleReducer,
} from './_types'

export const reduceFromInitialState = <S extends ApplicationState>(
	upParticles: AnyUpParticle[],
	reducer: ParticleReducer<S>,
): Result<S, Error> => {
	return upParticles.reduce(
		(
			state: Result<S, Error>,
			upParticle: AnyUpParticle,
		): Result<S, Error> => {
			if (state.isOk()) {
				return reducer.reduce({ state: state.value, upParticle })
			} else {
				return state
			}
		},
		ok(reducer.initialState),
	)
}

export const makeParticleReducer = <
	S extends ApplicationState,
	R extends ParticleReducer<S>
>(
	input: Readonly<{
		applicationStateType: ApplicationStateType
		initialState: S
		reduce: (
			input: Readonly<{ state: S; upParticle: AnyUpParticle }>,
		) => Result<S, Error>
		combine: (
			input: Readonly<{ current: S; newState: S }>,
		) => Result<S, Error>
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
