import { Address } from '@radixdlt/account'
import { ResourceIdentifier } from '../src/dto/resourceIdentifier'

describe('ResourceIdentifier (RRI)', () => {
	it('can be created from address+name AND from id-string', () => {
		const address = Address.fromBase58String(
			'9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT',
		)._unsafeUnwrap()
		const name = 'FOOBAR'
		const rri = ResourceIdentifier.create({
			hash: address.publicKey.asData({ compressed: true }),
			name: name,
		})._unsafeUnwrap()

		const rriString =
			'foobar_rr1qfumuen7l8wthtz45p3ftn58pvrs9xlumvkuu2xet8egzkcklqteshmvuln'

		expect(rri.toString()).toBe(rriString)

		const rriFromString = ResourceIdentifier.fromString(
			rriString,
		)._unsafeUnwrap()

		expect(rriFromString.toString()).toBe('foobar_rr1qfumuen7l8wthtz45p3ftn58pvrs9xlumvkuu2xet8egzkcklqteshmvuln')
	})

	it('legacy rri works', () => {
		const rri = ResourceIdentifier.fromString(
			'/9S8LZFHXHTSJqNQ86ZeGKtFMJtqZbYPtgHWSC4LyYjSbduNRpDNN/ALEX',
		)._unsafeUnwrap()
		expect(rri.toString()).toBe('alex_rr1qfpwaflah2809h2rk834nepjeuduen6tgzlaleg4nlu2sx078rpzy8au6an')
	})
})
