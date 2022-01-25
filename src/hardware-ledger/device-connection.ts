import { log } from '@util'
import { RESPONSE_LENGTH_BYTES, StatusCode } from './_types'
import type Transport from '@ledgerhq/hw-transport'
import { err, ok, ResultAsync } from 'neverthrow'

export type LedgerTransport = typeof Transport

export const sendAPDU = (
  transport: LedgerTransport,
  cla: number,
  ins: number,
  p1: number = 0,
  p2: number = 0,
  statusCodes?: StatusCode[],
  data?: Buffer,
): ResultAsync<Buffer, Error> => ResultAsync.fromPromise(
  (async () => {
    log.debug(`Sending APDU to Ledger device:
			instruction: ${ins},
			p1: ${p1},
			p2: ${p2},
			data: ${data !== undefined ? data.toString('hex') : '<UNDEFINED>'},
		`)

    const paths = await transport.list()
    if (paths.length === 0) throw Error('No device found.')

    const device = await transport.open(paths[0])

    let result

    try {
      result = await device.send(cla, ins, p1, p2, data, statusCodes ?? [StatusCode.SW_OK])
    } catch (e) {
      await device.close()
      throw e
    }

    await device.close()

    return result
  }
  )(),
  e => e as Error
)


export const deviceConnection = () => {

}

export type OpenLedgerConnectionInput = Readonly<{
  deviceConnectionTimeout?: number
  radixAppToOpenWaitPolicy?: Readonly<{
    retryCount: number
    delayBetweenRetries: number
  }>
}>
