# `@radixdlt/data-formats`

## Usage
### JSON Decoding


#### Examples

Without dependencies, using provided stringTagDecoder:

```
import { JSONDecoding, stringTagDecoder } from '@radixdlt/data-formats`

const { fromJSON } = JSONDecoding()(stringTagDecoder)

fromJSON(':str:xyz') // Ok('xyz')
```

An object with dependencies:

```
import { JSONDecoding, stringTagDecoder, tagDecoder } from '@radixdlt/data-formats`
import { ok } from 'neverthrow'

const Object1 = {
    ...JSONDecoding()(stringTagDecoder)
}

const testTagDecoder = tagDecoder(':tst:')(value => ok(value)))

const { fromJSON } = JSONDecoding(Object1)(testTagDecoder)

fromJSON({
    a: ':str:foo',
    b: ':tst:bar`
}) // ok({ a: 'foo', b: 'bar' })
```

JSON decoding takes an object and applies `decoder`s to each key-value pair. `serializerDecoder` and `tagDecoder` are provided, but you can easily define a new decoder. Here is how `tagDecoder` is defined:

```
import { decoder } from '@radixdlt/data-formats'

const tagDecoder = (tag: string) => <T>(
	algorithm: (value: string) => Result<T, Error>,
): Decoder =>
	decoder<T>((value) =>
		isString(value) && `:${value.split(':')[1]}:` === tag
			? algorithm(value.slice(tag.length))
			: undefined,
	)
```

A `decoder` should supply a function that defines how the decoding should be applied. First it should do some validation logic (does this decoder apply to this value?), in this case checking if the value is a string and if has a matching tag. Then, apply some `algorithm` function, which is the actual decoding (create an instance of some object). If the validation fails, the decoder has to return `undefined`.



