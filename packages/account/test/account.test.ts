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
	Account,
	AccountT,
	AccountTypeHDT,
	BIP32T,
	BIP44T,
	HardwareWalletSimpleT,
	HDAccountTypeIdentifier,
	HDMasterSeed,
	HDNodeT,
	HDPathRadix,
	HDPathRadixT,
	Mnemonic,
	NetworkT,
	toObservable,
	Wallet,
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

		const account = Account.fromHDPathWithHDMasterSeed({
			hdPath,
			hdMasterSeed,
		})

		expect(account.isHDAccount).toBe(true)
		expect(account.isLocalHDAccount).toBe(true)
		expect(account.isHardwareAccount).toBe(false)

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

	it('can create accounts from private key', () => {
		const account = Account.fromPrivateKey({
			privateKey: privateKeyFromNum(1),
		})

		const expPubKey =
			'0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798'
		expect(account.publicKey.toString(true)).toBe(expPubKey)
		expect(account.uniqueIdentifier).toBe(`Non_hd_pubKey${expPubKey}`)
		expect(account.isHDAccount).toBe(false)
		expect(account.isLocalHDAccount).toBe(false)
		expect(account.isHardwareAccount).toBe(false)
	})

	it('hw account', (done) => {
		const subs = new Subscription()

		const hwWalletConnectSubject = new Subject<HardwareWalletSimpleT>()

		const mockHWWallet = (
			hardwareMnemonic?: string,
		): HardwareWalletSimpleT => {
			const mnemonic = Mnemonic.fromEnglishPhrase(
				hardwareMnemonic ??
					'equip will roof matter pink blind book anxiety banner elbow sun young',
			)._unsafeUnwrap()
			const masterSeed = HDMasterSeed.fromMnemonic({ mnemonic })
			const accountFromHDPath = (bip32Path: BIP32T): AccountT => {
				const bip44RadixPath = HDPathRadix.fromString(
					bip32Path.toString(),
				)._unsafeUnwrap()
				return Account.byDerivingNodeAtPath({
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
			Account.fromHDPathWithHardwareWallet({
				hdPath,
				hardwareWalletConnection: hwWalletConnectSubject.asObservable(),
			}).subscribe(
				(hwAccount) => {
					expect(hwAccount.isHDAccount).toBe(true)
					expect(hwAccount.isHardwareAccount).toBe(true)
					expect(hwAccount.isLocalHDAccount).toBe(false)
					expect(hwAccount.hdPath!.toString()).toBe(path)
					expect(hwAccount.publicKey.toString(true)).toBe(
						expectedPublicKey,
					)
					expect(
						(hwAccount.type as AccountTypeHDT).hdAccountType,
					).toBe(HDAccountTypeIdentifier.HARDWARE_OR_REMOTE)
					expect(hwAccount.uniqueIdentifier).toBe(
						`Hardware_HDaccount_at_path_m/44'/536'/2'/1/3`,
					)
					expect(
						hwAccount.equals(<AccountT>{
							publicKey: publicKeyFromBytes(
								Buffer.from(expectedPublicKey, 'hex'),
							)._unsafeUnwrap(),
						}),
					).toBe(true)

					const plaintext = 'Hello Bob!'

					subs.add(
						hwAccount
							.encrypt({
								plaintext,
								publicKeyOfOtherParty: bobPubKey,
							})
							.subscribe((encryptedMessage) => {
								MessageEncryption.decrypt({
									encryptedMessage,
									diffieHellmanPoint: bobPrivateKey.diffieHellman.bind(
										null,
										hwAccount.publicKey,
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
