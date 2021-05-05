import {
	ECPointOnCurve,
	MessageEncryption,
	privateKeyFromScalar,
	PublicKey,
	publicKeyCompressedByteCount,
	publicKeyFromBytes,
	sha256Twice,
	Signature,
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
	privateKeyFromScalar(UInt256.valueOf(privateKeyScalar))._unsafeUnwrap()

describe('account_type', () => {
	it('works', async (done) => {
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

		expect(signingKey.isHDSigningKey).toBe(true)
		expect(signingKey.isLocalHDSigningKey).toBe(true)
		expect(signingKey.isHardwareSigningKey).toBe(false)

		expect(signingKey.hdPath!.equals(hdPath)).toBe(true)

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

		expect(signingKey.publicKey.toString(true)).toBe(
			'026d5e07cfde5df84b5ef884b629d28d15b0f6c66be229680699767cd57c618288',
		)

		signingKey.sign(sha256Twice(message)).subscribe((sig) => {
			expect(sig.equals(expectedSignature)).toBe(true)
			done()
		})
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

		const hwWalletConnectSubject = new Subject<HardwareSigningKeyT>()

		const mockHWWallet = (
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
						publicKeyOfOtherParty: PublicKey
					}>,
				): Observable<ECPointOnCurve> => {
					return toObservable(
						accountFromHDPath(input.hdPath).__diffieHellman(
							input.publicKeyOfOtherParty,
						),
					)
				},
				derivePublicKey: (hdPath: BIP32T): Observable<PublicKey> =>
					of(accountFromHDPath(hdPath).publicKey),
				sign: (
					input: Readonly<{
						hashedMessage: Buffer
						hdPath: BIP32T
					}>,
				): Observable<Signature> => {
					return accountFromHDPath(input.hdPath).sign(
						input.hashedMessage,
					)
				},
			}
		}

		const path = `m/44'/536'/2'/1/3`

		const hdPath = HDPathRadix.fromString(path)._unsafeUnwrap()

		const bobPrivateKey = privateKeyFromScalar(
			UInt256.valueOf(1),
		)._unsafeUnwrap()
		const bobPubKey = bobPrivateKey.publicKey()

		const expectedPublicKey =
			'026d5e07cfde5df84b5ef884b629d28d15b0f6c66be229680699767cd57c618288'

		subs.add(
			SigningKey.fromHDPathWithHardwareWallet({
				hdPath,
				hardwareWalletConnection: hwWalletConnectSubject.asObservable(),
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
						`Hardware_HDaccount_at_path_m/44'/536'/2'/1/3`,
					)
					expect(
						hwSigningKey.equals(<SigningKeyT>{
							publicKey: publicKeyFromBytes(
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

		hwWalletConnectSubject.next(mockHWWallet())
	})
})
