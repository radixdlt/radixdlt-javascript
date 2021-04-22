import { UInt256 } from '@radixdlt/uint256'
import { Address, AddressT } from '../src'

import { generatePrivateKey, privateKeyFromScalar } from '@radixdlt/crypto'
import { NetworkT } from '../dist'

// TODO CODE DUPLICATION remove to separate test package...
export const toAddress = (bech32String: string): AddressT =>
	Address.fromUnsafe(bech32String)._unsafeUnwrap()

describe('AccountAddress', () => {
	it('can generate new account address', () => {
		const doGenerate = (): string => {
			const privateKey = generatePrivateKey()
			const publicKey = privateKey.publicKey()

			const address = Address.fromPublicKeyAndNetwork({
				publicKey: publicKey,
				network: NetworkT.BETANET
			})

			expect(Address.isAccountAddress(address)).toBe(true)
			const addressString = address.toString()
			Address.fromUnsafe(addressString).match(
				(a) => {
					expect(a.equals(address)).toBe(true)
				},
				(e) => {
					throw e
				}
			)
			return addressString
		}

		doGenerate()
		// const str = Array(30).fill(undefined).map((_) => `'${doGenerate()}',`).join('\n')
		// console.log(`Addresses:\n${str}`)

	})

	it('can be created from a publicKey and network id', async () => {
		const privateKey = privateKeyFromScalar(
			UInt256.valueOf(1),
		)._unsafeUnwrap()
		const publicKey = privateKey.publicKey()

		const address = Address.fromPublicKeyAndNetwork({
			publicKey: publicKey,
			network: NetworkT.BETANET
		})

		expect(Address.isAccountAddress(address)).toBe(true)

		const expctedAddressBase58 =
			'brx1qsp8n0nx0muaewav2ksx99wwsu9swq5mlndjmn3gm9vl9q2mzmup0xqmhf7fh'
		expect(address.toString()).toBe(expctedAddressBase58)

		const addressFromString = Address.fromUnsafe(
			expctedAddressBase58,
		)._unsafeUnwrap()

		expect(publicKey.equals(addressFromString.publicKey)).toBeTruthy()

		expect(addressFromString.equals(address)).toBe(true)
	})

	it('should consider the same address to be equal itself', () => {
		const makeAddress = (): AddressT =>
			toAddress('brx1qsp8n0nx0muaewav2ksx99wwsu9swq5mlndjmn3gm9vl9q2mzmup0xqmhf7fh')
		expect(makeAddress().equals(makeAddress())).toBe(true)
	})

	it('should consider two different address with the same networkId but different publicKeys as inequal', async () => {
		const alice = toAddress(
			'brx1qsp8n0nx0muaewav2ksx99wwsu9swq5mlndjmn3gm9vl9q2mzmup0xqmhf7fh',
		)
		const bob = toAddress(
			'brx1qspnn7enq9a0yhnppx50gz2njjt8p0gvns7x3uzvpdnvuhy7nwt3gpce2qk0c',
		)
		expect(alice.network).toBe(bob.network)
		expect(alice.equals(bob)).toBe(false)
	})

})
