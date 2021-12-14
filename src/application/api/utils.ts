import { log } from '@util'
import { Observable, throwError, timer } from 'rxjs'
import { mergeMap } from 'rxjs/operators'

export const retryOnErrorCode =
	({
		maxRetryAttempts = 3,
		scalingDuration = 1000,
		errorCodes = [],
	}: {
		maxRetryAttempts?: number
		scalingDuration?: number
		errorCodes?: number[]
	} = {}) =>
	(attempts: Observable<{ error: { code: number } }>) =>
		attempts.pipe(
			mergeMap(({ error }, i) => {
				const retryAttempt = i + 1
				const foundErrorCode = errorCodes.some(e => e === error.code)
				// if maximum number of retries have been met
				// or response is a error code we don't wish to retry, throw error
				if (retryAttempt > maxRetryAttempts || !foundErrorCode) {
					return throwError(() => error)
				}
				log.debug(
					`Attempt ${retryAttempt}: retrying in ${
						retryAttempt * scalingDuration
					}ms`,
				)
				return timer(retryAttempt * scalingDuration)
			}),
		)
