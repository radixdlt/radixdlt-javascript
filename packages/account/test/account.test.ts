import { privateKeyFromScalar, PublicKey, Signature, UnsignedMessage, unsignedPlainText } from '@radixdlt/crypto'
import { UInt256 } from '@radixdlt/uint256'
import { EMPTY, Observable, of } from 'rxjs'
import { childAccountFromHDPath, hwAccountFromHDPath } from '../src/account'
import { BIP32, bip44, bip44FromString, HardwareWallet } from '../src/_index'

const mnemonic = 'equip will roof matter pink blind book anxiety banner elbow sun young'

describe('account', () => {
	describe('hdPath account', () => {
		it('works', async (done) => {
			const hdPath = bip44FromString(`m/44'/536'/2'/1/3`)._unsafeUnwrap()

			const account = childAccountFromHDPath({
				hdPath,
				rootKey: {
					mnemonic
				}
			})

			expect(account.accountId.accountIdString).toBe(hdPath.toString())

			// Expected keys are known from Leger app development. 
			const matchingPrivateKey = privateKeyFromScalar(new UInt256('f423ae3097703022b86b87c15424367ce827d11676fae5c7fe768de52d9cce2e', 16))._unsafeUnwrap()

			const message = unsignedPlainText({ plainText: 'hey' })
			const expectedSignature = (await matchingPrivateKey.sign(message))._unsafeUnwrap()

			account.derivePublicKey().subscribe(pk => {
				expect(pk.toString(true)).toBe('026d5e07cfde5df84b5ef884b629d28d15b0f6c66be229680699767cd57c618288')

				account.sign(message).subscribe(sig => {
					expect(sig.equals(expectedSignature)).toBe(true)
					done()
				})
			})

		
		})
	})
})
