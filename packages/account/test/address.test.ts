import { UInt256 } from '@radixdlt/uint256'
import { Address, AddressT } from '../src'

import { generatePrivateKey, privateKeyFromScalar } from '@radixdlt/crypto'
import { log } from '@radixdlt/util'
import { NetworkT } from '../dist'

// TODO CODE DUPLICATION remove to separate test package...
export const toAddress = (bech32String: string): AddressT =>
	Address.fromUnsafe(bech32String)._unsafeUnwrap()

describe('Address', () => {
	it('can generate new account address', () => {
		const doGenerate = (): string => {


		const privateKey = generatePrivateKey()
		const publicKey = privateKey.publicKey()

		const address = Address.fromPublicKeyAndNetwork({
			publicKey: publicKey,
			network: NetworkT.MAINNET
		})

		expect(Address.isAccountAddress(address)).toBe(true)
			return address.toString()
		}
		const addresses: string[] = []
		for (let i = 0; i < 100; i++) {
			addresses.push(doGenerate())
		}
		const addreString = addresses.map(a => `'${a}',`).join('\n')
		console.log(`✅ \n${addreString}`)
	})

	it('can be created from a publicKey and network id', async () => {
		const privateKey = privateKeyFromScalar(
			UInt256.valueOf(1),
		)._unsafeUnwrap()
		const publicKey = privateKey.publicKey()

		const address = Address.fromPublicKeyAndNetwork({
			publicKey: publicKey,
			network: NetworkT.MAINNET
		})

		expect(Address.isAccountAddress(address)).toBe(true)

		const expctedAddressBase58 =
			'9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT'
		expect(address.toString()).toBe(expctedAddressBase58)

		const addressFromString = Address.fromUnsafe(
			expctedAddressBase58,
		)._unsafeUnwrap()

		expect(publicKey.equals(addressFromString.publicKey)).toBeTruthy()

		expect(addressFromString.equals(address)).toBe(true)
	})

	it('should consider the same address to be equal itself', () => {
		const makeAddress = (): AddressT =>
			toAddress('9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT')
		expect(makeAddress().equals(makeAddress())).toBe(true)
	})

	it('should consider two different address with the same magic but different publicKeys as inequal', async () => {
		const alice = toAddress(
			'9S9LHeQNFpNJYqLtTJeAbos1LCC5Q7HBiGwPf2oju3NRq5MBKAGt',
		)
		const bob = toAddress(
			'9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT',
		)
		expect(alice.network).toBe(bob.network)
		expect(alice.equals(bob)).toBe(false)
	})

})
