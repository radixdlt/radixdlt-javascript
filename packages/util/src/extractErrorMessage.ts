type MessageOwner = {
	message: string
}

type FailureOwner = {
	failure: string
}

type ErrorMessageOwner = {
	error: string
}

type ErrorCodeOwner = {
	code: string
}

type NestedErrorOwner = {
	error: MessageOwner | FailureOwner | ErrorMessageOwner | ErrorCodeOwner
}

const isString = (something: unknown): something is string =>
	typeof something === 'string'

const isNonEmptyString = (something: unknown): boolean =>
	isString(something) && something.length > 0

const isMessageOwner = (something: unknown): something is MessageOwner => {
	const inspection = something as MessageOwner
	return (
		inspection.message !== undefined && isNonEmptyString(inspection.message)
	)
}

const isFailureOwner = (something: unknown): something is FailureOwner => {
	const inspection = something as FailureOwner
	return (
		inspection.failure !== undefined && isNonEmptyString(inspection.failure)
	)
}

const isErrorMessageOwner = (
	something: unknown,
): something is ErrorMessageOwner => {
	const inspection = something as ErrorMessageOwner
	return inspection.error !== undefined && isNonEmptyString(inspection.error)
}

const isErrorCodeOwner = (something: unknown): something is ErrorCodeOwner => {
	const inspection = something as ErrorCodeOwner
	return inspection.code !== undefined && isNonEmptyString(inspection.code)
}

const isNestedErrorOwner = (
	something: unknown,
): something is NestedErrorOwner => {
	const inspection = something as NestedErrorOwner
	if (!inspection.error) {
		return false
	}
	const err = inspection.error
	return (
		isMessageOwner(err) ||
		isFailureOwner(err) ||
		isErrorMessageOwner(err) ||
		isErrorCodeOwner(err)
	)
}
export const msgFromError = (e: unknown, dumpJSON: boolean = true): string => {
	if (isNonEmptyString(e)) return e as string
	if (isMessageOwner(e)) return e.message
	if (isFailureOwner(e)) return e.failure
	if (isErrorMessageOwner(e)) return e.error
	if (isErrorCodeOwner(e)) return e.code
	if (isNestedErrorOwner(e)) {
		const inner = e.error
		return msgFromError(inner)
	} else {
		if (dumpJSON) {
			const dump = JSON.stringify(e, null, 4)
			return `Unknown (json: ${dump})`
		} else {
			return 'Unknown (maybe not an error?)'
		}
	}
}
