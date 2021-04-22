import { Address, Bech32 } from '@radixdlt/account'
import { ResourceIdentifier } from '../src/dto/resourceIdentifier'
import { Result } from 'neverthrow'
import { ResourceIdentifierT } from '..'
import { msgFromError } from '@radixdlt/util'

describe('ResourceIdentifier (RRI)', () => {
	it('can be created from address+name AND from id-string', () => {
		const address = Address.fromUnsafe(
			'brx1yqfumuen7l8wthtz45p3ftn58pvrs9xlumvkuu2xet8egzkcklqteszew0sc',
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

		expect(rriFromString.toString()).toBe(
			'foobar_rr1qfumuen7l8wthtz45p3ftn58pvrs9xlumvkuu2xet8egzkcklqteshmvuln',
		)
	})

	it('rri any constructor', () => {
		const rriString =
			'xrd_rr1qfumuen7l8wthtz45p3ftn58pvrs9xlumvkuu2xet8egzkcklqtesv2yq5l'
		const doTest = <T>(
			makeRRI: (input: T) => Result<ResourceIdentifierT, Error>,
		): void => {
			// @ts-ignore
			makeRRI(rriString).match(
				(rri) => {
					expect(rri.name).toBe('xrd')
				},
				(e) => {
					throw e
				},
			)
		}
		doTest(ResourceIdentifier.fromUnsafe)
		doTest(ResourceIdentifier.fromString)
		doTest(ResourceIdentifier.fromBech32String)
	})


	// it('create rris for mocked tokens', () => {
	// 	const doTest = (symbol: string, address?: string): void => {
	// 		const hash = address === undefined ? Buffer.alloc(0) : Address.fromUnsafe(address).map(a => Buffer.from()) _unsafeUnwrap({ withStackTrace: true })
	// 		const rri = ResourceIdentifier.create({ hash, name: symbol })
	// 		const rriString =
	// 	}
	//
	// })

	it('rri bech32', () => {
		const doTest = (
			name: string,
			expectedRRI: string,
			hash: Buffer,
		): void => {
			const doTestRRI = (rriToCheck: ResourceIdentifierT): void => {
				expect(rriToCheck.toString()).toBe(expectedRRI)
				expect(rriToCheck.hash.toString('hex')).toBe(
					hash.toString('hex'),
				)
				expect(rriToCheck.name).toBe(name)
			}
			const rri = ResourceIdentifier.create({
				hash,
				name,
			})._unsafeUnwrap()
			doTestRRI(rri)
			const rriFromString = ResourceIdentifier.fromBech32String(
				expectedRRI,
			)._unsafeUnwrap()
			doTestRRI(rriFromString)
			expect(rriFromString.equals(rri)).toBe(true)
		}
		doTest(
			'foobar',
			'foobar_rr1m6kmamckpjzlw',
			Buffer.from('deadbeef', 'hex'),
		)
		doTest(
			'hello',
			'hello_rr1w3jhxar5v4ehguwx8gq',
			Buffer.from('testtest', 'utf8'),
		)
	})


	describe('test non happy paths', () => {
		it('rri checksum invalid bech32 string', () => {
			const bechString = 'hello_rr1w3jhxar5v4ehguwx8g3' // "8g3" should have been "8gq";
			Bech32.decode({ bechString }).match(
				(s) => {
					throw new Error('Expected failure')
				},
				(e) => {
					expect(msgFromError(e)).toBe(
						`Invalid checksum for ${bechString}`,
					)
				},
			)
		})
	})
})
