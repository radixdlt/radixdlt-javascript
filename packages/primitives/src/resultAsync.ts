import { Result, ResultAsync, okAsync } from 'neverthrow'

export const resultToAsync = <T, E>(
	result: Result<T, E>,
): ResultAsync<T, E> => {
	return result.asyncAndThen((value) => {
		return okAsync(value)
	})
}
