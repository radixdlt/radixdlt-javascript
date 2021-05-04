import { privateKeyFromScalar, PublicKey, sha256Twice } from '@radixdlt/crypto'
import { UInt256 } from '@radixdlt/uint256'
import { Account, HDMasterSeed, HDPathRadix, Mnemonic, NetworkT } from '../src'

const privateKeyFromNum = (privateKeyScalar: number) => privateKeyFromScalar(
	UInt256.valueOf(privateKeyScalar),
)._unsafeUnwrap()

describe('account', () => {
	it('works', async (done) => {
		const mnemonic = Mnemonic.fromEnglishPhrase(
			'equip will roof matter pink blind book anxiety banner elbow sun young',
		)._unsafeUnwrap()
		const hdMasterSeed = HDMasterSeed.fromMnemonic({ mnemonic })
		const hdPath = HDPathRadix.fromString(
			`m/44'/536'/2'/1/3`,
		)._unsafeUnwrap()

		const account = Account.fromHDPathWithHDMasterSeed({
			hdPath,
			hdMasterSeed,
		})

		expect(account.hdPath!.equals(hdPath)).toBe(true)

		// Expected keys are known from Leger app development.
		const matchingPrivateKey = privateKeyFromScalar(
			new UInt256(
				'f423ae3097703022b86b87c15424367ce827d11676fae5c7fe768de52d9cce2e',
				16,
			),
		)._unsafeUnwrap()

		const message = 'hey'
		const expectedSignature = (
			await matchingPrivateKey.signUnhashed({ msgToHash: message })
		)._unsafeUnwrap()

		expect(account.publicKey.toString(true)).toBe(
			'026d5e07cfde5df84b5ef884b629d28d15b0f6c66be229680699767cd57c618288',
		)

		account.sign(sha256Twice(message)).subscribe((sig) => {
			expect(sig.equals(expectedSignature)).toBe(true)
			done()
		})
	})

	it('can create hw accounts', () => {

		const account = Account.fromPrivateKey({
			privateKey: privateKeyFromNum(1)
		})

		expect(account.uniqueIdentifier).toBe(`Non_hd_pubKey0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798`)
	})
})
