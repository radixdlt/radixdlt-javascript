import { WrappedLedgerTransport } from '../src/ledger/wrapped/wrappedTransport'
import { LedgerNano } from '../src/ledger/ledgerNano'
import { RadixAPDU } from '../src/ledger/apdu'
import { HDPathRadix } from '@radixdlt/account'
import { Observable, of, Subscription } from 'rxjs'

describe('wrappedTransport', () => {
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

			const ledgerNano = LedgerNano.mock(mockedTransport)

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
					.sendAPDUCommandToDevice({
						apdu: RadixAPDU.getPublicKey({ hdPath }),
					})
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
