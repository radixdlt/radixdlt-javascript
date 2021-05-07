import { WrappedLedgerTransport } from '../src/ledger/wrapped/wrappedTransport'
import { LedgerNano } from '../src/ledger/ledgerNano'
import { RadixAPDU } from '../src/ledger/apdu'
import { HDPathRadix, Mnemonic } from '@radixdlt/account'
import { Observable, of, Subscription } from 'rxjs'
import { arraysEqual, buffersEquals } from '@radixdlt/util'
import { HardwareWallet } from '../src/hardwareWallet'
import { PublicKey } from '@radixdlt/crypto'

describe('wrappedTransport', () => {
	describe('recorded', () => {
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
						path: HDPathRadix.fromString(`m/44'/536'/2'/1/3`)._unsafeUnwrap(),
					})
					.subscribe(
						(publicKey: PublicKey) => {
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
								'026d5e07cfde5df84b5ef884b629d28d15b0f6c66be229680699767cd57c618288',
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

			const hdPath = HDPathRadix.create({
				account: 0x66aabbcc, // automatically hardened
				change: 1,
				address: { index: 0x55ffeedd, isHardened: false },
			})

			expect(hdPath.toString()).toBe(
				`m/44'/536'/1722465228'/1/1442836189`,
			)

			subs.add(
				ledgerNano
					.sendAPDUToDevice(RadixAPDU.getPublicKey({ hdPath, requireConfirmationOnDevice: false }))
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
							expect(buf.toString('hex')).toBe(
								mockedLedgerResponse,
							)
							done()
						},
						(e) => done(e),
					),
			)
		})
	})
})
