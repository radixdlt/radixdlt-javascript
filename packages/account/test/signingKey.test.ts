import {
	ECPointOnCurveT,
	MessageEncryption,
	PublicKeyT,
	PublicKey,
	PrivateKey,
	sha256Twice,
	SignatureT,
	Signature,
	Mnemonic,
	HDMasterSeed,
	BIP32T,
	HDPathRadix,
	HDPathRadixT,
} from '@radixdlt/crypto'
import { UInt256 } from '@radixdlt/uint256'
import {
	SigningKey,
	SigningKeyT,
	SigningKeyTypeHDT,
	HDSigningKeyTypeIdentifier,
} from '../src'
import { Observable, of, Subscription } from 'rxjs'
import { toObservable } from '@radixdlt/util'
import { HardwareSigningKeyT } from '@radixdlt/hardware-wallet'

const privateKeyFromNum = (privateKeyScalar: number) =>
	PrivateKey.fromScalar(UInt256.valueOf(privateKeyScalar))._unsafeUnwrap()

describe('signingKey_type', () => {
	it('works', () => {
		const mnemonic = Mnemonic.fromEnglishPhrase(
			'equip will roof matter pink blind book anxiety banner elbow sun young',
		)._unsafeUnwrap()
		const hdMasterSeed = HDMasterSeed.fromMnemonic({ mnemonic })
		const hdPath = HDPathRadix.fromString(
			`m/44'/536'/2'/1/3'`,
		)._unsafeUnwrap()

		const signingKey = SigningKey.fromHDPathWithHDMasterSeed({
			hdPath,
			hdMasterSeed,
		})

		expect(signingKey.isHDSigningKey).toBe(true)
		expect(signingKey.isLocalHDSigningKey).toBe(true)
		expect(signingKey.isHardwareSigningKey).toBe(false)

		expect(signingKey.hdPath!.equals(hdPath)).toBe(true)

		expect(signingKey.publicKey.toString(true)).toBe(
			'02a61e5f4dd2bdc5352243264aa431702c988e77ecf9e61bbcd0b0dd26ad2280fc',
		)
	})

	it('radix_hd_path_hardened', async (done) => {
		const mnemonic = Mnemonic.fromEnglishPhrase(
			'equip will roof matter pink blind book anxiety banner elbow sun young',
		)._unsafeUnwrap()
		const hdMasterSeed = HDMasterSeed.fromMnemonic({ mnemonic })
		const hdPath = HDPathRadix.fromString(
			`m/44'/536'/2'/1/3`,
		)._unsafeUnwrap()

		const signingKey = SigningKey.fromHDPathWithHDMasterSeed({
			hdPath,
			hdMasterSeed,
		})

		expect(signingKey.publicKey.toString(true)).toBe(
			'026d5e07cfde5df84b5ef884b629d28d15b0f6c66be229680699767cd57c618288',
		)

		const otherPubKey = PublicKey.fromBuffer(
			Buffer.from(
				'0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
				'hex',
			),
		)._unsafeUnwrap()
		const keyExchange = (
			await signingKey.__diffieHellman(otherPubKey)
		)._unsafeUnwrap()
		expect(keyExchange.toString()).toBe(
			'6d5e07cfde5df84b5ef884b629d28d15b0f6c66be229680699767cd57c6182883fa2aff69be05f792a02d6ef657240b17c44614a53e45dff4c529bfb012b9646',
		)

		const message = `I'm testing Radix awesome hardware wallet!`
		const hashedMessage = sha256Twice(message)
		expect(hashedMessage.toString('hex')).toBe(
			'be7515569e05daffc71bffe2a30365b74450c017a56184ee26699340a324d402',
		)

		const subs = new Subscription()

		subs.add(
			signingKey.sign(hashedMessage).subscribe((sig) => {
				expect(sig.toDER()).toBe(
					'3044022078b0d2d17d227a8dd14ecdf0d7d65580ac6c17ab980c50074e6c096c4081313202207a9819ceedab3bfd3d22452224394d6cb41e3441f4675a5e7bf58f059fdf34cd',
				)

				expect(sig.r.toString(16)).toBe(
					'78b0d2d17d227a8dd14ecdf0d7d65580ac6c17ab980c50074e6c096c40813132',
				)
				expect(sig.s.toString(16)).toBe(
					'7a9819ceedab3bfd3d22452224394d6cb41e3441f4675a5e7bf58f059fdf34cd',
				)

				const rsBufHex =
					'78b0d2d17d227a8dd14ecdf0d7d65580ac6c17ab980c50074e6c096c408131327a9819ceedab3bfd3d22452224394d6cb41e3441f4675a5e7bf58f059fdf34cd'

				const sigFromRS = Signature.fromRSBuffer(
					Buffer.from(rsBufHex, 'hex'),
				)._unsafeUnwrap()

				expect(sigFromRS.toDER()).toBe(
					'3044022078b0d2d17d227a8dd14ecdf0d7d65580ac6c17ab980c50074e6c096c4081313202207a9819ceedab3bfd3d22452224394d6cb41e3441f4675a5e7bf58f059fdf34cd',
				)
				expect(sigFromRS.equals(sig)).toBe(true)
				expect(sig.equals(sigFromRS)).toBe(true)

				done()
			}),
		)
	})

	it('radix_hd_path_0H00', () => {
		const mnemonic = Mnemonic.fromEnglishPhrase(
			'equip will roof matter pink blind book anxiety banner elbow sun young',
		)._unsafeUnwrap()
		const hdMasterSeed = HDMasterSeed.fromMnemonic({ mnemonic })
		const hdPath0H00 = HDPathRadix.fromString(
			`m/44'/536'/0'/0/0`,
		)._unsafeUnwrap()

		const signingKey0H00 = SigningKey.fromHDPathWithHDMasterSeed({
			hdPath: hdPath0H00,
			hdMasterSeed,
		})

		expect(signingKey0H00.publicKey.toString(true)).toBe(
			'021d15f715b83b2067cb241a9ba6257cbcb145f4a635c9f73b56f72e658950241e',
		)
	})

		it('can create accounts from private key', () => {
		const signingKey = SigningKey.fromPrivateKey({
			privateKey: privateKeyFromNum(1),
		})

		const expPubKey =
			'0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798'
		expect(signingKey.publicKey.toString(true)).toBe(expPubKey)
		expect(signingKey.uniqueIdentifier).toBe(`Non_hd_pubKey${expPubKey}`)
		expect(signingKey.isHDSigningKey).toBe(false)
		expect(signingKey.isLocalHDSigningKey).toBe(false)
		expect(signingKey.isHardwareSigningKey).toBe(false)
	})

	it('hw signingKey', (done) => {
		const subs = new Subscription()

		const mockHardwareSigningKey = (
			hdPath: HDPathRadixT,
			hardwareMnemonic?: string,
		): HardwareSigningKeyT => {
			const mnemonic = Mnemonic.fromEnglishPhrase(
				hardwareMnemonic ??
					'equip will roof matter pink blind book anxiety banner elbow sun young',
			)._unsafeUnwrap()
			const masterSeed = HDMasterSeed.fromMnemonic({ mnemonic })

			const signingKeyLocalHD = SigningKey.byDerivingNodeAtPath({
				hdPath,
				deriveNodeAtPath: () => masterSeed.masterNode().derive(hdPath),
			})
			return {
				keyExchange: (
					publicKeyOfOtherParty: PublicKeyT,
				): Observable<ECPointOnCurveT> => {
					return toObservable(
						signingKeyLocalHD.__diffieHellman(
							publicKeyOfOtherParty,
						),
					)
				},
				publicKey: signingKeyLocalHD.publicKey,
				sign: (hashedMessage: Buffer): Observable<SignatureT> => {
					return signingKeyLocalHD.sign(hashedMessage)
				},
			}
		}

		const path = `m/44'/536'/2'/1/3`

		const hdPath = HDPathRadix.fromString(path)._unsafeUnwrap()

		const bobPrivateKey = PrivateKey.fromScalar(
			UInt256.valueOf(1),
		)._unsafeUnwrap()
		const bobPubKey = bobPrivateKey.publicKey()

		const expectedPublicKey =
			'026d5e07cfde5df84b5ef884b629d28d15b0f6c66be229680699767cd57c618288'

		const hwSigningKey = SigningKey.fromHDPathWithHWSigningKey({
			hdPath,
			hardwareSigningKey: mockHardwareSigningKey(hdPath),
		})
		expect(hwSigningKey.isHDSigningKey).toBe(true)
		expect(hwSigningKey.isHardwareSigningKey).toBe(true)
		expect(hwSigningKey.isLocalHDSigningKey).toBe(false)
		expect(hwSigningKey.hdPath!.toString()).toBe(path)
		expect(hwSigningKey.publicKey.toString(true)).toBe(expectedPublicKey)
		expect((hwSigningKey.type as SigningKeyTypeHDT).hdSigningKeyType).toBe(
			HDSigningKeyTypeIdentifier.HARDWARE_OR_REMOTE,
		)
		expect(hwSigningKey.uniqueIdentifier).toBe(
			`Hardware_HD_signingKey_at_path_m/44'/536'/2'/1/3`,
		)
		expect(
			hwSigningKey.equals(<SigningKeyT>{
				publicKey: PublicKey.fromBuffer(
					Buffer.from(expectedPublicKey, 'hex'),
				)._unsafeUnwrap(),
			}),
		).toBe(true)

		const plaintext = 'Hello Bob!'

		subs.add(
			hwSigningKey
				.encrypt({
					plaintext,
					publicKeyOfOtherParty: bobPubKey,
				})
				.subscribe((encryptedMessage) => {
					MessageEncryption.decrypt({
						encryptedMessage,
						diffieHellmanPoint: bobPrivateKey.diffieHellman.bind(
							null,
							hwSigningKey.publicKey,
						),
					}).match(
						(decrypted) => {
							expect(decrypted.toString('utf8')).toBe(plaintext)
							done()
						},
						(error) => {
							done(error)
						},
					)
				}),
		)
	})
})
