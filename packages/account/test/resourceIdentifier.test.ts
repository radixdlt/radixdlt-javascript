import { Address, Bech32 } from '@radixdlt/account'
import { ResourceIdentifier } from '@radixdlt/application'
import { msgFromError } from '@radixdlt/util'
import { generateKeyPair, privateKeyFromScalar } from '@radixdlt/crypto'
import { UInt256 } from '@radixdlt/uint256'

describe('ResourceIdentifier (RRI)', () => {
	it('can be created from address+name AND from id-string', () => {
		const publicKey = privateKeyFromScalar(UInt256.valueOf(1))._unsafeUnwrap().publicKey()
		const name = 'foobar'
		// const rri = ResourceIdentifier.fromPublicKeyAndName({
		// 	publicKey,
		// 	name,
		// })._unsafeUnwrap()

		const rriString =
			'foobar_rr1qvxxahk06h4sntwv0lg26ft784dcp95uwm86fq6h0qlswuq4ur'

		const rriFromString = ResourceIdentifier.fromUnsafe(
			rriString,
		)._unsafeUnwrap()
		expect(rriFromString.name).toBe(name)
		// expect(rri.toString()).toBe(rriString)
		// expect(rriFromString.toString()).toBe(rriString)
	})

	// it('system rri', () => {
	// 	const xrd = ResourceIdentifier.systemRRI('xrd')._unsafeUnwrap()
	// 	expect(xrd.name).toBe('xrd')
	// 	const xrdRriString = xrd.toString()
	//
	// 	const expectedRriString = 'xrd_rr1qy5wfsfh'
	// 	expect(xrdRriString).toBe(expectedRriString)
	// 	const xrdFromString = ResourceIdentifier.fromUnsafe(expectedRriString)._unsafeUnwrap()
	//
	// 	console.log(`🔮 xrd ${JSON.stringify(xrd, null, 4)}, toString: ${xrd.toString()}`)
	// 	console.log(`🔮 xrdFromString ${JSON.stringify(xrdFromString, null, 4)}, toString: ${xrdFromString.toString()}`)
	//
	//
	// 	expect(xrdFromString.name).toBe('xrd')
	// 	expect(xrdFromString.equals(xrd)).toBe(true)
	// 	expect(xrdFromString.toString()).toBe(xrd.toString())
	// })


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
	// 		const bechString = 'xrd_rr1qy5wfsf3' // "f3" should have been "fh";
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
