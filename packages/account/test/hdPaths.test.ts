import { bip44Purpose } from '@radixdlt/account'
import { bip44FromString } from '../src/_index'

describe('HD paths', () => {
	describe('BIP44', () => {
		it('can be created from a string', () => {
            const path = `m/44'/536'/0'/1/0`
			const bip44Path = bip44FromString(path)._unsafeUnwrap()
            expect(bip44Path.toString()).toBe(path)

            // Check 'purpose' component
            const purpose = bip44Path.purpose
            expect(purpose.name).toBe('purpose')
            expect(purpose.level).toBe(1)
            expect(purpose.isHardened).toBe(true)
            expect(purpose.index.toString(16)).toBe('8000002c') // 0x2c = 44 dec

            // Check 'coin type' component
            const coinType = bip44Path.coinType
            expect(coinType.name).toBe('coin type')
            expect(coinType.level).toBe(2)
            expect(coinType.isHardened).toBe(true)
            expect(coinType.index.toString(16)).toBe('80000218') // 0x218 = 536 dec

            // Check 'account' component
            const account = bip44Path.account
            expect(account.name).toBe('account')
            expect(account.level).toBe(3)
            expect(account.isHardened).toBe(true)
            expect(account.index.toString(16)).toBe('80000000')

            // Check 'change' component
            const change = bip44Path.change
            expect(change.name).toBe('change')
            expect(change.level).toBe(4)
            expect(change.isHardened).toBe(false)
            expect(change.index.toString(16)).toBe('1') 

            // Check 'address' component
            const addressIndex = bip44Path.addressIndex
            expect(addressIndex.name).toBe('address index')
            expect(addressIndex.level).toBe(5)
            expect(addressIndex.isHardened).toBe(false)
            expect(addressIndex.index.toString(16)).toBe('0')
		})
	})
})
