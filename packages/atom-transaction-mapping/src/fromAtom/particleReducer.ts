import { AnyUpParticle, upParticle } from '@radixdlt/atom'
import { ok, Result } from 'neverthrow'
import {
	ApplicationState,
	ApplicationStateType,
	ParticleReducer,
} from './_types'

export const reduceFromInitialState = <S extends ApplicationState>(
	input: Readonly<{
		initialState: S
		reduce: (
			input: Readonly<{ state: S; upParticle: AnyUpParticle }>,
		) => Result<S, Error>
		upParticles: AnyUpParticle[]
	}>,
): Result<S, Error> =>
	input.upParticles.reduce(
		(
			state: Result<S, Error>,
			upParticle: AnyUpParticle,
		): Result<S, Error> => {
			if (state.isOk()) {
				return input.reduce({ state: state.value, upParticle })
			} else {
				return state
			}
		},
		ok(input.initialState),
	)

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

	return <R>{
		...input,
		reduceFromInitialState: (upParticles) =>
			reduceFromInitialState<S>({ ...input, upParticles }),
	}
}
