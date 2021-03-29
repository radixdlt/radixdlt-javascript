import { ok } from 'neverthrow'
import {
	taggedStringDecoder,
	JSONDecoding as decoding,
} from '@radixdlt/data-formats'

const JSONDecoding = (() => {
	const strTagDecoder = taggedStringDecoder(':str:')((value) => ok(value))

	const decodingFn = decoding
	decodingFn.withDecoders = decoding.withDecoders.bind(null, strTagDecoder)
	decodingFn.withDependencies = decoding.withDependencies.bind(null, {
		JSONDecoders: [strTagDecoder],
		// eslint-disable-next-line
		fromJSON: (() => {}) as any,
	})

	return decodingFn
})()

export { JSONDecoding }
