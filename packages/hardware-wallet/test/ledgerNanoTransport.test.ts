import { LedgerNanoTransport } from '../src/ledger/wrapped/ledgerNanoTransport'
import { WrappedLedgerTransport } from '../src/ledger/wrapped/wrappedTransport'
import { LedgerNano } from '../src/ledger/ledgerNano'
import { RadixAPDU } from '../src/ledger/apdu'
import { BIP44, HDPathRadix } from '@radixdlt/account'
import { Observable, of, Subscription } from 'rxjs'

describe('wrappedTransport', () => {
	describe('mocked', () => {
		it('getPublicKey', (done) => {
			const subs = new Subscription()
			const mockedLedgerResponse = 'deadbeef'

			let cla: number

			const mockedTransport = WrappedLedgerTransport.mock({
				send: (
					_cla: number,
					_ins: number,
					_p1: number,
					_p2: number,
					_data?: Buffer,
					_statusList?: ReadonlyArray<number>,
				): Observable<Buffer> => {
					cla = _cla
					return of(Buffer.from(mockedLedgerResponse, 'hex'))
				},
			})

			const ledgerNano = LedgerNano.mock(mockedTransport)

			const hdPath = HDPathRadix.create({ address: { index: 0 } })

			subs.add(
				ledgerNano
					.sendAPDUCommandToDevice({
						apdu: RadixAPDU.getPublicKey({ hdPath }),
					})
					.subscribe(
						(buf) => {
							expect(cla).toBe(0xaa)
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
