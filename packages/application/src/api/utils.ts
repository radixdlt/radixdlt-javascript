import { err, Result, ok } from 'neverthrow'

export const hasRequiredProps = <T extends Record<string, unknown>>(
	methodName: string,
	obj: T,
	props: string[],
): Result<T, Error[]> => {
	for (const prop of props) {
		if (obj[prop] === undefined) {
			return err([
				Error(
					`Prop validation failed for ${methodName} response. ${prop} was undefined.`,
				),
			])
		}
	}
	return ok(obj)
}
