import { Bech32 } from '../src/bech32'
import { publicKeyFromBytes } from '@radixdlt/crypto'
import { ValidatorAddress } from '../src'
import { msgFromError } from '@radixdlt/util'

describe('bech32', () => {
	it('to from bech32 data', () => {
		const plaintext = 'Hello Radix!'
		const bech32DataHex = '09011216181b030f04010906021903090f001010'
		const bech32Data = Buffer.from(bech32DataHex, 'hex')
		const decodedBech32Data = Bech32.convertDataFromBech32(bech32Data)
		expect(decodedBech32Data.toString('utf8')).toBe(plaintext)

		const convertedToBech32Data = Bech32.convertDataToBech32(
			Buffer.from(plaintext, 'utf8'),
		)

		expect(convertedToBech32Data.toString('hex')).toBe(bech32DataHex)
	})

	it('validator address', () => {
		const pubKey = publicKeyFromBytes(Buffer.from('030cfcefa07af9dd6dbe770b87d7dbdd2c31ba7f4fcf8f3a1196d502f13561b046', 'hex'))._unsafeUnwrap()

		const validatorAddress = ValidatorAddress.fromPublicKey(pubKey)

		expect(validatorAddress.publicKey.equals(pubKey)).toBe(true)
		expect(validatorAddress.toString()).toBe('vb1qvx0emaq0tua6md7wu9c047mm5krrwnlfl8c7ws3jm2s9uf4vxcyvrwrazy')

	})

	describe('failures', () => {

		it('rri bech32 string checksum invalid', () => {
			const bechString = 'hello_rr1w3jhxar5v4ehguwx8g3'  // "8g3" should have been "8gq";
			Bech32.decode({ bechString }).match(
				(s) => { throw new Error('Expected failure') },
				(e) => {
					expect(msgFromError(e)).toBe(`Invalid checksum for ${bechString}`)
				}
			)
		})
	})
})
