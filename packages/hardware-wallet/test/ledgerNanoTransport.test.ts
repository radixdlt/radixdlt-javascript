import { WrappedLedgerTransport } from '../src/ledger/wrapped/wrappedTransport'
import { LedgerNano } from '../src/ledger/ledgerNano'
import { RadixAPDU } from '../src/ledger/apdu'
import { HDPathRadix, Mnemonic } from '@radixdlt/account'
import { Observable, of, Subscription } from 'rxjs'
import { HardwareWallet } from '../src/hardwareWallet'
import {
	ECPointOnCurveT,
	PublicKey,
	publicKeyFromBytes,
} from '@radixdlt/crypto'
import { SemVerT } from '../src'

describe('wrappedTransport', () => {
	describe('recorded', () => {
		it('getVersion', (done) => {
			const subs = new Subscription()

			const ledgerNano = LedgerNano.emulate({
				mnemonic: Mnemonic.fromEnglishPhrase(
					'equip will roof matter pink blind book anxiety banner elbow sun young',
				)._unsafeUnwrap(),
			})

			const store = ledgerNano.store

			let hardwareWallet = HardwareWallet.ledger(ledgerNano)

			subs.add(
				hardwareWallet.getVersion().subscribe(
					(semVer: SemVerT) => {
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

						// Assert response
						expect(semVer.toString()).toBe('1.2.3')
						const major = response.data.readUInt8(0)
						const minor = response.data.readUInt8(1)
						const patch = response.data.readUInt8(2)
						expect(semVer.major).toBe(major)
						expect(semVer.minor).toBe(minor)
						expect(semVer.patch).toBe(patch)
						done()
					},
					(e) => done(e),
				),
			)
		})

		it('getPublicKey', (done) => {
			const subs = new Subscription()

			const ledgerNano = LedgerNano.emulate({
				mnemonic: Mnemonic.fromEnglishPhrase(
					'equip will roof matter pink blind book anxiety banner elbow sun young',
				)._unsafeUnwrap(),
			})

			const store = ledgerNano.store

			let hardwareWallet = HardwareWallet.ledger(ledgerNano)

			subs.add(
				hardwareWallet
					.getPublicKey({
						// both Account and Address will be hardened.
						path: HDPathRadix.fromString(
							`m/44'/536'/2'/1/3`,
						)._unsafeUnwrap(),
					})
					.subscribe(
						(publicKey: PublicKey) => {
							expect(store.recorded.length).toBe(1)
							const request = store.lastRequest()
							const response = store.lastResponse()

							// Assert request
							expect(request.cla).toBe(0xaa)
							expect(request.ins).toBe(0x08)
							expect(request.p1).toBe(0)
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
							expect(publicKey.toString(true)).toBe(
								'02a61e5f4dd2bdc5352243264aa431702c988e77ecf9e61bbcd0b0dd26ad2280fc',
							)

							done()
						},
						(e) => done(e),
					),
			)
		})
	})

	it('doKeyExchange', (done) => {
		const subs = new Subscription()

		const ledgerNano = LedgerNano.emulate({
			mnemonic: Mnemonic.fromEnglishPhrase(
				'equip will roof matter pink blind book anxiety banner elbow sun young',
			)._unsafeUnwrap(),
		})

		const store = ledgerNano.store

		let hardwareWallet = HardwareWallet.ledger(ledgerNano)

		const publicKeyOfOtherParty = publicKeyFromBytes(
			Buffer.from(
				'0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
				'hex',
			),
		)._unsafeUnwrap()

		expect(publicKeyOfOtherParty.toString(false)).toBe('0479be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8')

		subs.add(
			hardwareWallet
				.doKeyExchange({
					// both Account and Address will be hardened.
					path: HDPathRadix.fromString(
						`m/44'/536'/2'/1/3`,
					)._unsafeUnwrap(),
					publicKeyOfOtherParty,
				})
				.subscribe(
					(ecPointOnCurve: ECPointOnCurveT) => {
						expect(store.recorded.length).toBe(1)
						const request = store.lastRequest()
						const response = store.lastResponse()

						// Assert request
						expect(request.cla).toBe(0xaa)
						expect(request.ins).toBe(0x04)
						expect(request.p1).toBe(0)
						expect(request.p2).toBe(0)
						expect(request.data).toBeDefined()
						expect(request.data!.toString('hex')).toBe('0000000200000001000000030479be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8')
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

						done()
					},
					(e) => done(e),
				),
		)
	})
})

describe('mocked', () => {
	it('getPublicKey', (done) => {
		const subs = new Subscription()
		const mockedLedgerResponse = 'deadbeef'

		let sentCla: number
		let sentIns: number
		let sentP1: number
		let sentP2: number
		let sentData: Buffer | undefined
		let sentStatusList: number[] | undefined

		const mockedTransport = WrappedLedgerTransport.mock({
			send: (
				cla: number,
				ins: number,
				p1: number,
				p2: number,
				data?: Buffer,
				statusList?: ReadonlyArray<number>,
			): Observable<Buffer> => {
				sentCla = cla
				sentIns = ins
				sentP1 = p1
				sentP2 = p2
				sentData = data
				sentStatusList =
					statusList !== undefined ? [...statusList] : undefined
				return of(Buffer.from(mockedLedgerResponse, 'hex'))
			},
		})

		const ledgerNano = LedgerNano.wrappedTransport(mockedTransport)

		const path = HDPathRadix.create({
			account: 0x66aabbcc, // automatically hardened
			change: 1,
			address: { index: 0x55ffeedd, isHardened: false },
		})

		expect(path.toString()).toBe(`m/44'/536'/1722465228'/1/1442836189`)

		subs.add(
			ledgerNano
				.sendAPDUToDevice(
					RadixAPDU.getPublicKey({
						path,
						requireConfirmationOnDevice: false,
					}),
				)
				.subscribe(
					(buf) => {
						expect(sentCla).toBe(0xaa)
						expect(sentIns).toBe(0x08)
						expect(sentP1).toBe(0)
						expect(sentP2).toBe(0)
						expect(sentData).toBeDefined()
						expect(sentData!.toString('hex')).toBe(
							'66aabbcc0000000155ffeedd',
						)
						expect(sentStatusList).toBeDefined()
						expect(sentStatusList!).toStrictEqual([0x9000])
						expect(buf.toString('hex')).toBe(mockedLedgerResponse)
						done()
					},
					(e) => done(e),
				),
		)
	})
})
