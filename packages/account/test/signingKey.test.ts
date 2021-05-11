import {
	ECPointOnCurveT,
	MessageEncryption,
	PublicKeyT,
	PublicKey,
	PrivateKey,
	sha256Twice,
	SignatureT,
} from '@radixdlt/crypto'
import { UInt256 } from '@radixdlt/uint256'
import {
	SigningKey,
	SigningKeyT,
	SigningKeyTypeHDT,
	BIP32T,
	BIP44T,
	HardwareSigningKeyT,
	HDSigningKeyTypeIdentifier,
	HDMasterSeed,
	HDNodeT,
	HDPathRadix,
	HDPathRadixT,
	Mnemonic,
	NetworkT,
	toObservable,
	SigningKeychain,
} from '../src'
import { Observable, of, Subject, Subscription, throwError } from 'rxjs'

const privateKeyFromNum = (privateKeyScalar: number) =>
	PrivateKey.fromScalar(UInt256.valueOf(privateKeyScalar))._unsafeUnwrap()

describe('signingKey_type', () => {
	it('works', async (done) => {
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

		// Expected keys are known from Leger app development.
		const matchingPrivateKey = PrivateKey.fromScalar(
			new UInt256(
				'f423ae3097703022b86b87c15424367ce827d11676fae5c7fe768de52d9cce2e',
				16,
			),
		)._unsafeUnwrap()

		const message = `I'm testing Radix awesome hardware wallet!`
		const hashedMessage = sha256Twice(message)
		expect(hashedMessage.toString('hex')).toBe(
			'be7515569e05daffc71bffe2a30365b74450c017a56184ee26699340a324d402',
		)
		const expectedSignature = (
			await matchingPrivateKey.signUnhashed({ msgToHash: message })
		)._unsafeUnwrap()

		expect(signingKey.publicKey.toString(true)).toBe(
			'026d5e07cfde5df84b5ef884b629d28d15b0f6c66be229680699767cd57c618288',
		)

		signingKey.sign(hashedMessage).subscribe((sig) => {
			expect(sig.equals(expectedSignature)).toBe(true)
			expect(sig.toDER()).toBe(
				'3044022078b0d2d17d227a8dd14ecdf0d7d65580ac6c17ab980c50074e6c096c4081313202207a9819ceedab3bfd3d22452224394d6cb41e3441f4675a5e7bf58f059fdf34cd',
			)
			done()
		})
	})

	it('radix_hd_path_hardened', async (done) => {
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
			'a61e5f4dd2bdc5352243264aa431702c988e77ecf9e61bbcd0b0dd26ad2280fcf2a8c7dc20f325655b8de617c5b5425a8fca413a033f50790b69588b0a5f7986',
		)

		expect(signingKey.publicKey.toString(true)).toBe(
			'02a61e5f4dd2bdc5352243264aa431702c988e77ecf9e61bbcd0b0dd26ad2280fc',
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
					'304402207ba64bd4116e9af1d8b52591da3ed5c831e75418f1eec37fb4a4cc7374a49b8a02202b08793fbecf04de5013826f0c15a7b9750d89606544d67a13a5f23f457b5aeb',
				)
				done()
			}),
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

		const hwSigningKeychainConnectSubject = new Subject<HardwareSigningKeyT>()

		const mockHWSigningKeychain = (
			hardwareMnemonic?: string,
		): HardwareSigningKeyT => {
			const mnemonic = Mnemonic.fromEnglishPhrase(
				hardwareMnemonic ??
					'equip will roof matter pink blind book anxiety banner elbow sun young',
			)._unsafeUnwrap()
			const masterSeed = HDMasterSeed.fromMnemonic({ mnemonic })
			const accountFromHDPath = (bip32Path: BIP32T): SigningKeyT => {
				const bip44RadixPath = HDPathRadix.fromString(
					bip32Path.toString(),
				)._unsafeUnwrap()
				return SigningKey.byDerivingNodeAtPath({
					hdPath: bip44RadixPath,
					deriveNodeAtPath: () =>
						masterSeed.masterNode().derive(bip44RadixPath),
				})
			}
			return {
				diffieHellman: (
					input: Readonly<{
						hdPath: BIP32T
						publicKeyOfOtherParty: PublicKeyT
					}>,
				): Observable<ECPointOnCurveT> => {
					return toObservable(
						accountFromHDPath(input.hdPath).__diffieHellman(
							input.publicKeyOfOtherParty,
						),
					)
				},
				derivePublicKey: (hdPath: BIP32T): Observable<PublicKeyT> =>
					of(accountFromHDPath(hdPath).publicKey),
				sign: (
					input: Readonly<{
						hashedMessage: Buffer
						hdPath: BIP32T
					}>,
				): Observable<SignatureT> => {
					return accountFromHDPath(input.hdPath).sign(
						input.hashedMessage,
					)
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

		subs.add(
			SigningKey.fromHDPathWithHardwareWallet({
				hdPath,
				hardwareWalletConnection: hwSigningKeychainConnectSubject.asObservable(),
			}).subscribe(
				(hwSigningKey) => {
					expect(hwSigningKey.isHDSigningKey).toBe(true)
					expect(hwSigningKey.isHardwareSigningKey).toBe(true)
					expect(hwSigningKey.isLocalHDSigningKey).toBe(false)
					expect(hwSigningKey.hdPath!.toString()).toBe(path)
					expect(hwSigningKey.publicKey.toString(true)).toBe(
						expectedPublicKey,
					)
					expect(
						(hwSigningKey.type as SigningKeyTypeHDT)
							.hdSigningKeyType,
					).toBe(HDSigningKeyTypeIdentifier.HARDWARE_OR_REMOTE)
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
										expect(decrypted.toString('utf8')).toBe(
											plaintext,
										)
										done()
									},
									(error) => {
										done(error)
									},
								)
							}),
					)
				},
				(e) => {
					done(e)
				},
			),
		)

		hwSigningKeychainConnectSubject.next(mockHWSigningKeychain())
	})
})
