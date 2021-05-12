import { fromLedgerTransportNodeHID, LedgerNano } from '../src/ledger/ledgerNano'
import { HDPathRadix, Mnemonic } from '@radixdlt/account'
import { ReplaySubject, Subscription } from 'rxjs'
import { HardwareWallet } from '../src/hardwareWallet'
import { ECPointOnCurveT, PublicKey, PublicKeyT, sha256Twice, SignatureT } from '@radixdlt/crypto'
import {
	EmulatedLedgerIO,
	HardwareWalletT,
	LedgerInstruction,
	LedgerResponseCodes,
	MockedLedgerNanoStoreT,
	SemVerT,
} from '../src'
import { LedgerButtonPress, PromptUserForInput, PromptUserForInputType } from '../src/ledger/emulatedLedger'
import { MockedLedgerNanoRecorder } from '../src/ledger/mockedLedgerNanoRecorder'
import { SemVer } from '../src/ledger/semVer'
import { log } from '@radixdlt/util/dist/logging'
import { BasicLedgerTransport, openConnection } from '../src/ledger/ledgerNanoDeviceConnector'

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
			subs: Subscription
			hardwareWallet: HardwareWalletT
			done: jest.DoneCallback
			onResponse?: (version: SemVerT) => void
		}>,
	): void => {
		const { hardwareWallet, done, subs } = input
		const onResponse = input.onResponse ?? ((_) => {})

		subs.add(
			hardwareWallet.getVersion().subscribe({
				next: (semVer: SemVerT) => {
					onResponse(semVer)
					done()
				},
				error: (e) => done(e),
			}),
		)
	}

	const testGetPublicKey = (
		input: Readonly<{
			subs: Subscription
			hardwareWallet: HardwareWalletT
			done: jest.DoneCallback
			assertMockedLedgerState?: (publicKey: PublicKeyT) => void
		}>,
	): void => {
		const { hardwareWallet, done, subs } = input
		const assertMockedLedgerState =
			input.assertMockedLedgerState ?? ((_) => {})

		subs.add(
			hardwareWallet
				.getPublicKey({
					// both Account and Address will be hardened.
					path: HDPathRadix.fromString(
						`m/44'/536'/2'/1/3`,
					)._unsafeUnwrap(),
					requireConfirmationOnDevice: true,
				})
				.subscribe(
					(publicKey: PublicKeyT) => {
						assertMockedLedgerState(publicKey)

						// Assert response

						expect(publicKey.toString(true)).toBe(
							'02a61e5f4dd2bdc5352243264aa431702c988e77ecf9e61bbcd0b0dd26ad2280fc',
						)

						done()
					},
					(e) => done(e),
				),
		)
	}

	const testDoSignHash = (
		input: Readonly<{
			subs: Subscription
			hardwareWallet: HardwareWalletT
			done: jest.DoneCallback
			onResponse?: (signature: SignatureT) => void
		}>,
	): void => {
		const { hardwareWallet, done, subs } = input
		const onResponse = input.onResponse ?? ((_) => {})

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
						onResponse(signature)
						expect(signature.toDER()).toBe(
							'304402207ba64bd4116e9af1d8b52591da3ed5c831e75418f1eec37fb4a4cc7374a49b8a02202b08793fbecf04de5013826f0c15a7b9750d89606544d67a13a5f23f457b5aeb',
						)
						done()
					},
					(e) => done(e),
				),
		)
	}

	const testDoKeyExchange = (
		input: Readonly<{
			subs: Subscription
			hardwareWallet: HardwareWalletT
			done: jest.DoneCallback
			assertMockedLedgerState?: (ecPointOnCurve: ECPointOnCurveT) => void
		}>,
	): void => {
		const { hardwareWallet, done, subs } = input
		const assertMockedLedgerState =
			input.assertMockedLedgerState ?? ((_) => {})

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
					requireConfirmationOnDevice: true,
				})
				.subscribe(
					(ecPointOnCurve: ECPointOnCurveT) => {
						assertMockedLedgerState(ecPointOnCurve)
						expect(ecPointOnCurve.toString()).toBe(
							'a61e5f4dd2bdc5352243264aa431702c988e77ecf9e61bbcd0b0dd26ad2280fcf2a8c7dc20f325655b8de617c5b5425a8fca413a033f50790b69588b0a5f7986',
						)
						done()
					},
					(e) => done(e),
				),
		)
	}

	describe('emulated', () => {
		it('getVersion', (done) => {
			const subs = new Subscription()

			const hardcodedVersion = SemVer.fromString('2.5.9')._unsafeUnwrap()

			const { store, hardwareWallet } = emulateHardwareWallet({
				hardcodedVersion,
			})

			testGetVersion({
				subs,
				hardwareWallet,
				done,
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
				subs,
				hardwareWallet,
				done,
				assertMockedLedgerState: (publicKey: PublicKeyT) => {
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
				done,
				subs,
				hardwareWallet,
				onResponse: (signature: SignatureT) => {
					expect(userWasPromptedToConfirmSignHash).toBe(true)

					expect(store.userIO.length).toBe(1)

					expect(store.recorded.length).toBe(1)
					const request = store.lastRequest()
					const response = store.lastResponse()

					// Assert request
					expect(request.cla).toBe(0xaa)
					expect(request.ins).toBe(0x02)
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
					expect(signature.toDER()).toBe(
						response.data.toString('hex'),
					)
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
				subs,
				hardwareWallet,
				done,
				assertMockedLedgerState: (ecPointOnCurve: ECPointOnCurveT) => {
					expect(userWasPromptedToConfirmKeyExchange).toBe(true)
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
						'0000000200000001000000030479be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8',
					)
					expect(
						request.requiredResponseStatusCodeFromDevice!,
					).toStrictEqual([0x9000])

					// Assert response
					expect(ecPointOnCurve.toString()).toBe(
						response.data.toString('hex'),
					)
					expect(ecPointOnCurve.toString()).toBe(
						'a61e5f4dd2bdc5352243264aa431702c988e77ecf9e61bbcd0b0dd26ad2280fcf2a8c7dc20f325655b8de617c5b5425a8fca413a033f50790b69588b0a5f7986',
					)
				},
			})
		})
	})

	describe('integration', () => {

		beforeAll(() => {
			log.setLevel('debug')
		})

		afterAll(() => {
			log.setLevel('warn')
		})

		it(`semver_ledger`, async () => {
			const ledgerTransport: BasicLedgerTransport = await openConnection()
			const ledgerResponse = await ledgerTransport.send(0xaa, 0x00, 0, 0)
			console.log(`🔮got response from ledger: ${ledgerResponse.toString('hex')}`)
			const responseCode = ledgerResponse.slice(-2)
			expect(parseInt(responseCode.toString('hex'), 16)).toBe(LedgerResponseCodes.SW_OK)
			const result = ledgerResponse.slice(0, ledgerResponse.length - 2)
			console.log(`🔮 parsed result from ledger: ${result.toString('hex')}`)
			const semver = SemVer.fromBuffer(result)._unsafeUnwrap()
			expect(semver.toString()).toBe('0.0.1')
		})

		it(`semver_ledger2`, async (done) => {
			const ledgerTransport: BasicLedgerTransport = await openConnection()
			const ledger = fromLedgerTransportNodeHID(ledgerTransport)
			const subs = new Subscription()

			subs.add(
				ledger.sendAPDUToDevice({
					cla: 0xaa,
					ins: LedgerInstruction.GET_VERSION,
					p1: 0,
					p2: 0,
					data: undefined,
					requiredResponseStatusCodeFromDevice: [LedgerResponseCodes.SW_OK]
				}).subscribe((ledgerResponse) => {
					console.log(`🔮got response from ledger: ${ledgerResponse.toString('hex')}`)
					const responseCode = ledgerResponse.slice(-2)
					expect(parseInt(responseCode.toString('hex'), 16)).toBe(LedgerResponseCodes.SW_OK)
					const result = ledgerResponse.slice(0, ledgerResponse.length - 2)
					console.log(`🔮 parsed result from ledger: ${result.toString('hex')}`)
					const semver = SemVer.fromBuffer(result)._unsafeUnwrap()
					expect(semver.toString()).toBe('0.0.1')
					done()
				})
			)

		})

		it('getVersion_integration', async (done) => {
			const ledgerNano = await LedgerNano.waitForDeviceToConnect()
			const hardwareWallet = HardwareWallet.ledger(ledgerNano)

			const subs = new Subscription()

			testGetVersion({
				subs,
				hardwareWallet,
				done,
				onResponse: (version: SemVerT) => {
					expect(version.toString()).toBe('0.0.0')
				},
			})
		}, 120_000)

		it('getPublicKey_integration', async (done) => {
			const ledgerNano = await LedgerNano.waitForDeviceToConnect()
			const hardwareWallet = HardwareWallet.ledger(ledgerNano)

			const subs = new Subscription()
			testGetPublicKey({
				subs,
				hardwareWallet,
				done,
			})
		})

		it('doSignHash_integration', async (done) => {
			const ledgerNano = await LedgerNano.waitForDeviceToConnect()
			const hardwareWallet = HardwareWallet.ledger(ledgerNano)

			const subs = new Subscription()
			testDoSignHash({
				subs,
				hardwareWallet,
				done,
			})
		})

		it('doKeyExchange_integration', async (done) => {
			const ledgerNano = await LedgerNano.waitForDeviceToConnect()
			const hardwareWallet = HardwareWallet.ledger(ledgerNano)

			const subs = new Subscription()
			testDoKeyExchange({
				subs,
				hardwareWallet,
				done,
			})
		})
	})
})
