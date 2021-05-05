import { BIP44T, HDPathRadixT, BIP44, HDPathRadix } from '../src'

describe('BIP44', () => {
	it('can create one for radix', () => {
		const hdPath = BIP44.create({ address: { index: 1337 } })
		expect(hdPath.toString()).toBe(`m/44'/536'/0'/0/1337'`)
	})

	it('bip44 can be created from a string', () => {
		const doTestBIP44Path = (hdPath: BIP44T | HDPathRadixT): void => {
			expect(hdPath.toString()).toBe(path)

			// Check 'purpose' component
			const purpose = hdPath.purpose
			expect(purpose.name).toBe('purpose')
			expect(purpose.level).toBe(1)
			expect(purpose.isHardened).toBe(true)
			expect(purpose.index.toString(16)).toBe('8000002c') // 0x2c = 44 dec

			// Check 'coin type' component
			const coinType = hdPath.coinType
			expect(coinType.name).toBe('coin type')
			expect(coinType.level).toBe(2)
			expect(coinType.isHardened).toBe(true)
			expect(coinType.index.toString(16)).toBe('80000218') // 0x218 = 536 dec

			// Check 'account' component
			const account = hdPath.account
			expect(account.name).toBe('account')
			expect(account.level).toBe(3)
			expect(account.isHardened).toBe(true)
			expect(account.index.toString(16)).toBe('80000000')

			// Check 'change' component
			const change = hdPath.change
			expect(change.name).toBe('change')
			expect(change.level).toBe(4)
			expect(change.isHardened).toBe(false)
			expect(change.index.toString(16)).toBe('1')

			// Check 'address' component
			const addressIndex = hdPath.addressIndex
			expect(addressIndex.name).toBe('address index')
			expect(addressIndex.level).toBe(5)
			expect(addressIndex.isHardened).toBe(false)
			expect(addressIndex.index.toString(16)).toBe('0')
		}

		const path = `m/44'/536'/0'/1/0`
		doTestBIP44Path(BIP44.fromString(path)._unsafeUnwrap())
		doTestBIP44Path(HDPathRadix.fromString(path)._unsafeUnwrap())
	})

	it('should not be able to specify wrong coin type for radix path', () => {
		HDPathRadix.fromString(`m/44'/123'/0'/1/0`).match(
			() => {
				throw Error('expected error, but got none')
			},
			(f) =>
				expect(f.message).toBe(
					'Incorrect coin type, expected Radix coin type: 536, but got: 123',
				),
		)
	})
})
