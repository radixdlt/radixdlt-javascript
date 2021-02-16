import { addressFromBase58String } from '@radixdlt/crypto'
import { fromJSONDefault } from '@radixdlt/data-formats'
import { RRIParticleJSONDecoder } from '../src/particles/resourceIdentifierParticle'
import {
	JSON_TAG,
	resourceIdentifierFromAddressAndName,
	resourceIdentifierFromString,
	RRIJSONDecoder,
} from '../src/resourceIdentifier'
import { ResourceIdentifier } from '../src/_types'

describe('ResourceIdentifier (RRI)', () => {
	it('can be created from address+name AND from id-string', () => {
		const address = addressFromBase58String(
			'9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT',
		)._unsafeUnwrap()
		const name = 'FOOBAR'
		const rri = resourceIdentifierFromAddressAndName({
			address: address,
			name: name,
		})

		const rriString =
			'/9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT/FOOBAR'

		expect(rri.toString()).toBe(rriString)

		const rriFromString = resourceIdentifierFromString(
			rriString,
		)._unsafeUnwrap()

		expect(rriFromString.address)
	})

	it('should consider two RRIs with same address and name letters but different case as inequal', () => {
		const rriLowercase = resourceIdentifierFromString(
			'/9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT/case',
		)._unsafeUnwrap()

		const rriUppercase = resourceIdentifierFromString(
			'/9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT/CASE',
		)._unsafeUnwrap()

		expect(rriLowercase.equals(rriUppercase)).toBe(false)
	})

	it('should be able to DSON encode', () => {
		const rri = resourceIdentifierFromString(
			'/9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT/FOOBAR',
		)._unsafeUnwrap()
		const dson = rri.toDSON()._unsafeUnwrap()
		const expected =
			'583d062f3953386b684c485a6136467379476f36333478516f3951774c67534847705848485737363444356d50594263726e665a563652542f464f4f424152'

		expect(dson.toString('hex')).toBe(expected)
	})

	it('should be able to JSON encode', () => {
		const rri = resourceIdentifierFromString(
			'/9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT/FOOBAR',
		)._unsafeUnwrap()

		const json = rri.toJSON()
		const expected = `${JSON_TAG}/9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT/FOOBAR`

		expect(json).toEqual(expected)
	})

	/*
	it('should be able to JSON decode', () => {
		const fromJSON = fromJSONDefault(RRIJSONDecoder)()

		const raw = `${JSON_TAG}/9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT/FOOBAR`

		const result = fromJSON<ResourceIdentifier>(raw)
		const expected = resourceIdentifierFromString(
			'/9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT/FOOBAR',
		)._unsafeUnwrap()

		expect(JSON.stringify(result)).toEqual(JSON.stringify(expected))
	})*/
})
