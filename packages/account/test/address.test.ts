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
			'brx1yqfumuen7l8wthtz45p3ftn58pvrs9xlumvkuu2xet8egzkcklqteszew0sc'
		expect(address.toString()).toBe(expctedAddressBase58)

		const addressFromString = Address.fromUnsafe(
			expctedAddressBase58,
		)._unsafeUnwrap()

		expect(publicKey.equals(addressFromString.publicKey)).toBeTruthy()

		expect(addressFromString.equals(address)).toBe(true)
	})

	it('should consider the same address to be equal itself', () => {
		const makeAddress = (): AddressT =>
			toAddress('brx1yqfumuen7l8wthtz45p3ftn58pvrs9xlumvkuu2xet8egzkcklqteszew0sc')
		expect(makeAddress().equals(makeAddress())).toBe(true)
	})

	it('should consider two different address with the same networkId but different publicKeys as inequal', async () => {
		const alice = toAddress(
			'brx1yqfumuen7l8wthtz45p3ftn58pvrs9xlumvkuu2xet8egzkcklqteszew0sc',
		)
		const bob = toAddress(
			'brx1yqvh7yh5jvysjxrge27fwsg0rfktcztlurs43er4zyz4fe0jxa2uk6hhlalx',
		)
		expect(alice.network).toBe(bob.network)
		expect(alice.equals(bob)).toBe(false)
	})

})
