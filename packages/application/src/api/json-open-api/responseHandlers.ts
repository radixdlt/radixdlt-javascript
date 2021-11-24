import { decoder, JSONDecoding } from '@radixdlt/data-formats'
import { NetworkId } from '@radixdlt/primitives'
import { err, Result, ok } from 'neverthrow'
import { NetworkEndpoint } from './_types'

const hasRequiredProps = <T extends Record<string, unknown>>(
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

const networkDecoder = (...keys: string[]) =>
	decoder((value, key) =>
		key !== undefined &&
		keys.includes(key) &&
		typeof value === 'number' &&
		Object.keys(NetworkId).includes(value.toString())
			? // @ts-ignore
			  ok(NetworkId[value.toString()])
			: undefined,
	)

export const handleNetworkResponse = (json: NetworkEndpoint.Response) =>
	JSONDecoding.withDecoders(networkDecoder('network'))
		.create<NetworkEndpoint.Response, NetworkEndpoint.DecodedResponse>()(
			json,
		)
		.andThen(decoded =>
			hasRequiredProps('network', decoded, ['network', 'ledger_state']),
		)
