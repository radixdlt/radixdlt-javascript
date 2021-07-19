import {
	LedgerNanoT,
	LedgerResponseCodes,
	prettifyLedgerResponseCode,
	RadixAPDUT,
} from './_types'
import { from, Observable, throwError } from 'rxjs'

import { msgFromError, log } from '@radixdlt/util'

import {
	BasicLedgerTransport,
	OpenLedgerConnectionInput,
	send,
} from './device-connection'
import type TransportNodeHid from 'ledgerhq__hw-transport-node-hid'

const ledgerAPDUResponseCodeBufferLength = 2 // two bytes

const fromTransport = (
	basicLedgerTransport: BasicLedgerTransport,
): LedgerNanoT => {
	const sendAPDUToDevice = (apdu: RadixAPDUT): Observable<Buffer> =>
		new Observable<Buffer>(subscriber => {
			send({
				apdu,
				with: basicLedgerTransport,
			})
				.then(responseFromLedger => {
					if (!Buffer.isBuffer(responseFromLedger)) {
						responseFromLedger = Buffer.from(responseFromLedger) // Convert Uint8Array to Buffer for Electron renderer compatibility 💩
					}

					log.debug(
						`📲 🥩 Raw response from Ledger device: ${responseFromLedger.toString(
							'hex',
						)}`,
					)

					if (
						responseFromLedger.length <
						ledgerAPDUResponseCodeBufferLength
					) {
						const errMsg = `Got too short response from Ledger, expected all responses to be at least #${ledgerAPDUResponseCodeBufferLength} bytes, but got: #${responseFromLedger.length} bytes`
						log.error(errMsg)
						subscriber.error(new Error(errMsg))
					}

					const responseCodeBuf = responseFromLedger.slice(
						-ledgerAPDUResponseCodeBufferLength,
					)
					const responseCode: LedgerResponseCodes = parseInt(
						responseCodeBuf.toString('hex'),
						16,
					)

					log.debug(
						`📲 Response code Ledger device: ${prettifyLedgerResponseCode(
							responseCode,
						)}`,
					)

					if (
						!apdu.requiredResponseStatusCodeFromDevice.includes(
							responseCode,
						)
					) {
						const errMsg = `Invalid response code, got ${responseCode}, but requires any of: ${JSON.stringify(
							apdu.requiredResponseStatusCodeFromDevice,
							null,
							4,
						)}`
						log.error(errMsg)
						subscriber.error(new Error(errMsg))
					}

					const result = responseFromLedger.slice(
						0,
						responseFromLedger.length -
							ledgerAPDUResponseCodeBufferLength,
					)

					log.debug(
						`📲 ✅ Response data Ledger device: ${result.toString(
							'hex',
						)}`,
					)

					subscriber.next(result)
					subscriber.complete()
				})
				.catch(error => {
					if (
						// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
						error.statusCode !== undefined &&
						error.statusCode ===
							LedgerResponseCodes.SW_CLA_NOT_SUPPORTED
					) {
						const errMsg = `🤷‍♀️ Wrong app/Radix app not opened on Ledger yet. ${msgFromError(
							error,
						)}`
						log.error(errMsg)
						subscriber.error(new Error(errMsg))
					} else {
						const ledgerResponseCodesFromError: string | undefined =
							LedgerResponseCodes[error.statusCode]

						const underlyingError =
							ledgerResponseCodesFromError ?? msgFromError(error)

						const errMsg = `SEND APDU failed with underlying error: '${underlyingError}'`
						log.error(errMsg)

						subscriber.error(new Error(errMsg))
					}
				})
		})

	return {
		sendAPDUToDevice,
	}
}

const connect = async (transport: BasicLedgerTransport): Promise<LedgerNanoT> => fromTransport(transport)

export const LedgerNano = {
	connect,
}
