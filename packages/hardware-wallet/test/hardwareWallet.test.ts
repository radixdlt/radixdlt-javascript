import { HDPathRadix, Mnemonic } from '@radixdlt/account'
import { ReplaySubject, Subscription } from 'rxjs'
import {
	ECPointOnCurveT,
	PublicKey,
	PublicKeyT,
	sha256Twice,
	Signature,
	SignatureT,
} from '@radixdlt/crypto'
import {
	EmulatedLedgerIO,
	HardwareWalletT,
	LedgerInstruction,
	MockedLedgerNanoStoreT,
	HardwareWallet,
	SemVerT,
	SemVer,
	LedgerNano,
	MockedLedgerNanoRecorder,
	LedgerButtonPress,
	PromptUserForInput,
	PromptUserForInputType,
	LedgerNanoT,
} from '../src'
import { log } from '@radixdlt/util'

describe('hardwareWallet', () => {
	const emulateHardwareWallet = (
		input: Readonly<{
			io?: EmulatedLedgerIO | undefined
			hardcodedVersion?: SemVerT
		}>,
	): { hardwareWallet: HardwareWalletT; store: MockedLedgerNanoStoreT } => {
		const { io, hardcodedVersion } = input
		const recorder = MockedLedgerNanoRecorder.create(io)

		const ledgerNano = LedgerNano.emulate({
			mnemonic: Mnemonic.fromEnglishPhrase(
				'equip will roof matter pink blind book anxiety banner elbow sun young',
			)._unsafeUnwrap(),
			recorder,
			version: hardcodedVersion,
		})

		const hardwareWallet = HardwareWallet.ledger(ledgerNano)

		return {
			hardwareWallet,
			store: recorder,
		}
	}

	const testGetVersion = (
		input: Readonly<{
			hardwareWallet: HardwareWalletT
			onResponse?: (version: SemVerT) => void
		}>,
	): void => {
		const { hardwareWallet } = input
		const onResponse = input.onResponse ?? ((_) => {})
		const subs = new Subscription()

		subs.add(
			hardwareWallet.getVersion().subscribe({
				next: (semVer: SemVerT) => {
					onResponse(semVer)
				},
				error: (e) => {
					throw e
				},
			}),
		)
	}

	const testGetPublicKey = (
		input: Readonly<{
			hardwareWallet: HardwareWalletT
			requireConfirmationOnDevice?: boolean
			onResponse?: (publicKey: PublicKeyT) => void
		}>,
	): void => {
		const { hardwareWallet } = input
		const subs = new Subscription()

		const onResponse = input.onResponse ?? ((_) => {})

		subs.add(
			hardwareWallet
				.getPublicKey({
					// both Account and Address will be hardened.
					path: HDPathRadix.fromString(
						`m/44'/536'/2'/1/3`,
					)._unsafeUnwrap(),
					requireConfirmationOnDevice:
						input.requireConfirmationOnDevice ?? false,
				})
				.subscribe(
					(publicKey: PublicKeyT) => {
						expect(publicKey.toString(true)).toBe(
							'026d5e07cfde5df84b5ef884b629d28d15b0f6c66be229680699767cd57c618288',
						)
						onResponse(publicKey)
					},
					(e) => {
						throw e
					},
				),
		)
	}

	const testDoSignHash = (
		input: Readonly<{
			hardwareWallet: HardwareWalletT
			onResponse?: (signature: SignatureT) => void
		}>,
	): void => {
		const { hardwareWallet } = input
		const onResponse = input.onResponse ?? ((_) => {})

		const subs = new Subscription()

		const hashToSign = sha256Twice(
			`I'm testing Radix awesome hardware wallet!`,
		)

		subs.add(
			hardwareWallet
				.doSignHash({
					path: HDPathRadix.fromString(
						`m/44'/536'/2'/1/3`,
					)._unsafeUnwrap(),
					hashToSign,
					requireConfirmationOnDevice: true,
				})
				.subscribe(
					(signature: SignatureT) => {
						expect(signature.toDER()).toBe(
							'3044022078b0d2d17d227a8dd14ecdf0d7d65580ac6c17ab980c50074e6c096c4081313202207a9819ceedab3bfd3d22452224394d6cb41e3441f4675a5e7bf58f059fdf34cd',
						)
						onResponse(signature)
					},
					(e) => {
						throw e
					},
				),
		)
	}

	const testDoKeyExchange = (
		input: Readonly<{
			hardwareWallet: HardwareWalletT
			requireConfirmationOnDevice?: boolean
			onResponse?: (ecPointOnCurve: ECPointOnCurveT) => void
		}>,
	): void => {
		const { hardwareWallet } = input
		const onResponse = input.onResponse ?? ((_) => {})

		const subs = new Subscription()

		const publicKeyOfOtherParty = PublicKey.fromBuffer(
			Buffer.from(
				'0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
				'hex',
			),
		)._unsafeUnwrap()

		subs.add(
			hardwareWallet
				.doKeyExchange({
					// both Account and Address will be hardened.
					path: HDPathRadix.fromString(
						`m/44'/536'/2'/1/3`,
					)._unsafeUnwrap(),
					publicKeyOfOtherParty,
					requireConfirmationOnDevice:
						input?.requireConfirmationOnDevice ?? false,
				})
				.subscribe(
					(ecPointOnCurve: ECPointOnCurveT) => {
						expect(ecPointOnCurve.toString()).toBe(
							'6d5e07cfde5df84b5ef884b629d28d15b0f6c66be229680699767cd57c6182883fa2aff69be05f792a02d6ef657240b17c44614a53e45dff4c529bfb012b9646',
						)
						onResponse(ecPointOnCurve)
					},
					(e) => {
						throw e
					},
				),
		)
	}

	describe('emulated', () => {
		it('getVersion', (done) => {
			const hardcodedVersion = SemVer.fromString('2.5.9')._unsafeUnwrap()

			const { store, hardwareWallet } = emulateHardwareWallet({
				hardcodedVersion,
			})

			testGetVersion({
				hardwareWallet,
				onResponse: (semVer: SemVerT) => {
					expect(store.recorded.length).toBe(1)
					const request = store.lastRequest()
					const response = store.lastResponse()

					// Assert request
					expect(request.cla).toBe(0xaa)
					expect(request.ins).toBe(0x00)
					expect(request.p1).toBe(0)
					expect(request.p2).toBe(0)
					expect(request.data).toBeUndefined()
					expect(
						request.requiredResponseStatusCodeFromDevice!,
					).toStrictEqual([0x9000])

					expect(semVer.equals(hardcodedVersion)).toBe(true)
					expect(
						semVer.equals(
							SemVer.fromBuffer(response.data)._unsafeUnwrap(),
						),
					).toBe(true)

					done()
				},
			})
		})

		it('getPublicKey', (done) => {
			const subs = new Subscription()

			const usersInputOnLedger = new ReplaySubject<LedgerButtonPress>()
			const promptUserForInputOnLedger = new ReplaySubject<PromptUserForInput>()

			const { hardwareWallet, store } = emulateHardwareWallet({
				io: {
					usersInputOnLedger,
					promptUserForInputOnLedger,
				},
			})

			let userWasPromptedToConfirmGetPubKey = false

			subs.add(
				promptUserForInputOnLedger.subscribe({
					next: (prompt) => {
						if (
							prompt.type ===
							PromptUserForInputType.REQUIRE_CONFIRMATION
						) {
							userWasPromptedToConfirmGetPubKey =
								prompt.instruction ===
								LedgerInstruction.GET_PUBLIC_KEY
							usersInputOnLedger.next(
								LedgerButtonPress.RIGHT_ACCEPT,
							)
						}
					},
				}),
			)

			testGetPublicKey({
				hardwareWallet,
				requireConfirmationOnDevice: true,
				onResponse: (publicKey: PublicKeyT) => {
					expect(userWasPromptedToConfirmGetPubKey).toBe(true)
					expect(store.userIO.length).toBe(1)

					expect(store.recorded.length).toBe(1)
					const request = store.lastRequest()
					const response = store.lastResponse()

					// Assert request
					expect(request.cla).toBe(0xaa)
					expect(request.ins).toBe(0x08)
					expect(request.p1).toBe(1)
					expect(request.p2).toBe(0)

					expect(request.data).toBeDefined()
					expect(request.data!.toString('hex')).toBe(
						'000000020000000100000003',
					)
					expect(
						request.requiredResponseStatusCodeFromDevice!,
					).toStrictEqual([0x9000])

					// Assert response
					expect(publicKey.toString(true)).toBe(
						response.data.toString('hex'),
					)

					done()
				},
			})
		})

		it('emulated_DoSignHash', (done) => {
			const subs = new Subscription()

			const usersInputOnLedger = new ReplaySubject<LedgerButtonPress>()
			const promptUserForInputOnLedger = new ReplaySubject<PromptUserForInput>()

			const { hardwareWallet, store } = emulateHardwareWallet({
				io: {
					usersInputOnLedger,
					promptUserForInputOnLedger,
				},
			})

			let userWasPromptedToConfirmSignHash = false

			subs.add(
				promptUserForInputOnLedger.subscribe({
					next: (prompt) => {
						if (
							prompt.type ===
							PromptUserForInputType.REQUIRE_CONFIRMATION
						) {
							userWasPromptedToConfirmSignHash =
								prompt.instruction ===
								LedgerInstruction.DO_SIGN_HASH
							usersInputOnLedger.next(
								LedgerButtonPress.RIGHT_ACCEPT,
							)
						}
					},
				}),
			)

			testDoSignHash({
				hardwareWallet,
				onResponse: (signature: SignatureT) => {
					expect(userWasPromptedToConfirmSignHash).toBe(true)

					expect(store.userIO.length).toBe(1)

					expect(store.recorded.length).toBe(1)
					const request = store.lastRequest()
					const response = store.lastResponse()

					// Assert request
					expect(request.cla).toBe(0xaa)
					expect(request.ins).toBe(0x04)
					expect(request.p1).toBe(1)
					expect(request.p2).toBe(0)
					expect(request.data).toBeDefined()
					expect(request.data!.toString('hex')).toBe(
						'000000020000000100000003be7515569e05daffc71bffe2a30365b74450c017a56184ee26699340a324d402',
					)
					expect(
						request.requiredResponseStatusCodeFromDevice!,
					).toStrictEqual([0x9000])

					// Assert response
					expect(
						signature.equals(
							Signature.fromRSBuffer(
								response.data,
							)._unsafeUnwrap(),
						),
					).toBe(true)

					done()
				},
			})
		})

		it('emulated_DoKeyExchange', (done) => {
			const subs = new Subscription()

			const usersInputOnLedger = new ReplaySubject<LedgerButtonPress>()
			const promptUserForInputOnLedger = new ReplaySubject<PromptUserForInput>()

			const { hardwareWallet, store } = emulateHardwareWallet({
				io: {
					usersInputOnLedger,
					promptUserForInputOnLedger,
				},
			})

			let userWasPromptedToConfirmKeyExchange = false

			subs.add(
				promptUserForInputOnLedger.subscribe({
					next: (prompt) => {
						if (
							prompt.type ===
							PromptUserForInputType.REQUIRE_CONFIRMATION
						) {
							userWasPromptedToConfirmKeyExchange =
								prompt.instruction ===
								LedgerInstruction.DO_KEY_EXCHANGE
							usersInputOnLedger.next(
								LedgerButtonPress.RIGHT_ACCEPT,
							)
						}
					},
				}),
			)

			testDoKeyExchange({
				hardwareWallet,
				requireConfirmationOnDevice: true,
				onResponse: (ecPointOnCurve: ECPointOnCurveT) => {
					expect(userWasPromptedToConfirmKeyExchange).toBe(true)
					expect(store.userIO.length).toBe(1)

					expect(store.recorded.length).toBe(1)
					const request = store.lastRequest()
					const response = store.lastResponse()

					// Assert request
					expect(request.cla).toBe(0xaa)
					expect(request.ins).toBe(0x32)
					expect(request.p1).toBe(1)
					expect(request.p2).toBe(0)
					expect(request.data).toBeDefined()
					expect(request.data!.toString('hex')).toBe(
						'0000000200000001000000030479be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8',
					)
					expect(
						request.requiredResponseStatusCodeFromDevice!,
					).toStrictEqual([0x9000])

					// Assert response
					expect(ecPointOnCurve.toString()).toBe(
						response.data.toString('hex'),
					)

					done()
				},
			})
		})
	})

	describe('hw_ledger_integration', () => {
		let ledgerNano: LedgerNanoT
		beforeAll(() => {
			log.setLevel('debug')
		})

		afterEach((done) => {
			if (!ledgerNano) {
				done()
				return
			}
			const subs = new Subscription()
			// must close connection in between else finding a free ledger device for subsequent test will fail.
			subs.add(
				ledgerNano.close().subscribe(() => {
					done()
				}),
			)
		})

		afterAll(() => {
			log.setLevel('warn')
		})

		it('getVersion_integration', async (done) => {
			ledgerNano = await LedgerNano.waitForDeviceToConnect({
				deviceConnectionTimeout: 1_000,
			})
			const hardwareWallet = HardwareWallet.ledger(ledgerNano)

			testGetVersion({
				hardwareWallet,
				onResponse: (version: SemVerT) => {
					expect(version.toString()).toBe('0.0.1')
					done()
				},
			})
		})

		it('getPublicKey_integration', async (done) => {
			ledgerNano = await LedgerNano.waitForDeviceToConnect({
				deviceConnectionTimeout: 1_000,
			})
			const hardwareWallet = HardwareWallet.ledger(ledgerNano)

			testGetPublicKey({
				hardwareWallet,
				onResponse: (_publicKey) => {
					done()
				},
			})
		})

		// Not implemented on Ledger yet
		it.skip('doKeyExchange_integration', async (done) => {
			ledgerNano = await LedgerNano.waitForDeviceToConnect({
				deviceConnectionTimeout: 1_000,
			})
			const hardwareWallet = HardwareWallet.ledger(ledgerNano)

			testDoKeyExchange({
				hardwareWallet,
				onResponse: (_pointOncurve) => {
					done()
				},
			})
		}, 20_000)

		it('doSignHash_integration', async (done) => {
			ledgerNano = await LedgerNano.waitForDeviceToConnect({
				deviceConnectionTimeout: 1_000,
			})
			const hardwareWallet = HardwareWallet.ledger(ledgerNano)

			testDoSignHash({
				hardwareWallet,
				onResponse: (_signature) => {
					done()
				},
			})
		}, 20_000)
	})
})
