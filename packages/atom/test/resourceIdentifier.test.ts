import { addressFromBase58String } from '@radixdlt/crypto'
import {
	resourceIdentifierFromAddressAndName,
	resourceIdentifierFromString,
} from '../src/resourceIdentifier'

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
})
