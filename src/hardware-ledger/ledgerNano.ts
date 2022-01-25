import {
  LedgerNanoT,
  StatusCode,
  prettifyLedgerResponseCode,
  RadixAPDUT,
} from './_types'
import { Observable } from 'rxjs'
import { msgFromError, log } from '@util'
import { BasicLedgerTransport, sendAPDU_generic } from './device-connection'

const ledgerAPDUResponseCodeBufferLength = 2 // two bytes

const fromTransport = (
  basicLedgerTransport: BasicLedgerTransport,
): LedgerNanoT => {
  const sendAPDUToDevice = (apdu: RadixAPDUT): Observable<Buffer> =>
    new Observable<Buffer>(subscriber => {
      sendAPDU_generic({
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

          const responseCodeBuf = responseFromLedger.slice(
            -ledgerAPDUResponseCodeBufferLength,
          )
          const responseCode: StatusCode = parseInt(
            responseCodeBuf.toString('hex'),
            16,
          )

          log.debug(
            `📲 Response code Ledger device: ${prettifyLedgerResponseCode(
              responseCode,
            )}`,
          )

          if (
            !apdu.statusCodes.includes(responseCode)
          ) {
            const errMsg = `Invalid response code, got ${responseCode}, but requires any of: ${JSON.stringify(
              apdu.statusCodes,
              null,
              4,
            )}`
            log.error(errMsg)
            subscriber.error(new Error(errMsg))
          }

          const result = responseFromLedger.slice(
            0,
            responseFromLedger.length - ledgerAPDUResponseCodeBufferLength,
          )

          log.debug(
            `📲 ✅ Response data Ledger device: ${result.toString('hex')}`,
          )

          subscriber.next(result)
          subscriber.complete()
        })
        .catch(error => {
          if (
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            error.statusCode !== undefined &&
            error.statusCode === StatusCode.SW_CLA_NOT_SUPPORTED
          ) {
            const errMsg = `🤷‍♀️ Wrong app/Radix app not opened on Ledger yet. ${msgFromError(
              error,
            )}`
            log.error(errMsg)
            subscriber.error(new Error(errMsg))
          } else {
            const ledgerResponseCodesFromError: string | undefined =
              StatusCode[error.statusCode]

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

const connect = async (transport: BasicLedgerTransport): Promise<LedgerNanoT> =>
  fromTransport(transport)

export const LedgerNano = {
  connect,
}
