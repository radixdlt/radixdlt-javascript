import { Address, Bech32 } from '@radixdlt/account'
import { ResourceIdentifier } from '../src'
import { msgFromError } from '@radixdlt/util'

describe('ResourceIdentifier (RRI)', () => {
	// it('can be created from address+name AND from id-string', () => {
	// 	const address = Address.fromUnsafe(
	// 		'brx1qspqljn9rg7x97s3rcvyzal2uxr5q22d9xn8nc4rpq8vq08kg4ch8yqhs9dq6',
	// 	)._unsafeUnwrap()
	// 	const name = 'FOOBAR'
	// 	const rri = ResourceIdentifier.fromPublicKeyAndName({
	// 		publicKey: address.publicKey,
	// 		name: name,
	// 	})._unsafeUnwrap()
	//
	// 	const rriString =
	// 		'foobar_rr1qwlxrr6ffhqzkp7axjz0yscsf47taazk22x5zpk5hyasn5w6mm'
	//
	// 	expect(rri.toString()).toBe(rriString)
	//
	// 	const rriFromString = ResourceIdentifier.fromUnsafe(
	// 		rriString,
	// 	)._unsafeUnwrap()
	//
	// 	expect(rriFromString.toString()).toBe(rriString)
	// })

	it('system rri', () => {
		const xrd = ResourceIdentifier.systemRRI('xrd')._unsafeUnwrap()
		expect(xrd.name).toBe('xrd')
		const xrdRriString = xrd.toString()

		const expectedRriString = 'xrd_rr1qy5wfsfh'
		expect(xrdRriString).toBe(expectedRriString)
		const xrdFromString = ResourceIdentifier.fromUnsafe(expectedRriString)._unsafeUnwrap()

		expect(xrdFromString.name).toBe('xrd')
		expect(xrdFromString.equals(xrd)).toBe(true)
		expect(xrdFromString.toString()).toBe(xrd.toString())
	})


	// it('create rris for mocked tokens', () => {
	// 	const doTest = (symbol: string, address?: string): void => {
	// 		const hash = address === undefined ? Buffer.alloc(0) : Address.fromUnsafe(address).map(a => Buffer.from()) _unsafeUnwrap({ withStackTrace: true })
	// 		const rri = ResourceIdentifier.create({ hash, name: symbol })
	// 		const rriString =
	// 	}
	//
	// })



	// describe('test non happy paths', () => {
	// 	it('rri checksum invalid bech32 string', () => {
	// 		const bechString = 'hello_rr1w3jhxar5v4ehguwx8g3' // "8g3" should have been "8gq";
	// 		Bech32.decode({ bechString }).match(
	// 			(s) => {
	// 				throw new Error('Expected failure')
	// 			},
	// 			(e) => {
	// 				expect(msgFromError(e)).toBe(
	// 					`Invalid checksum for ${bechString}`,
	// 				)
	// 			},
	// 		)
	// 	})
	// })
})
