import {
  AccountT,
  TransactionStatus,
  TransactionTrackingEventType,
  log,
} from '@application'
import { Network } from '@primitives'
import { err, ok, ResultAsync } from 'neverthrow'
import { LogLevel, radixAPIError } from '@util'
import { RadixAPI } from '../api'
import { buildTx as _buildTx } from '../transaction/buildTx'
import { sendTransaction } from '../transaction/sendTransaction'

const buildTransactionMock = jest.fn()
const signMock = jest.fn()
const finalizeTransactionMock = jest.fn()
const submitSignedTransactionMock = jest.fn()
const transactionStatusMock = jest.fn()
const verifyTxMock = jest.fn()

const mockTrack = jest.fn()
const mockTrackError = jest.fn()

const mockAccount = ({ address: '123', sign: signMock } as unknown) as AccountT

const mockRadixApi = ({
  buildTransaction: () => buildTransactionMock,
  finalizeTransaction: finalizeTransactionMock,
  submitSignedTransaction: submitSignedTransactionMock,
  transactionStatus: transactionStatusMock,
  verifyTx: verifyTxMock,
} as unknown) as RadixAPI

const buildTx = _buildTx(mockTrack, mockAccount, mockRadixApi, mockTrackError)

const txIntent = {
  actions: [],
} as any

describe('send transaction', () => {
  beforeEach(() => {
    log.setLevel(LogLevel.SILENT)
    buildTransactionMock.mockReset()
    signMock.mockReset()
    finalizeTransactionMock.mockReset()
    submitSignedTransactionMock.mockReset()
    transactionStatusMock.mockReset()
    verifyTxMock.mockReset()
    mockTrack.mockReset()
    mockTrackError.mockReset()
  })

  describe('buildTx', () => {
    it('should build tx and call track twice', async () => {
      const expected = 'built tx'

      buildTransactionMock.mockReturnValueOnce(ok(expected))

      const builtTx = (await buildTx(txIntent))._unsafeUnwrap()

      expect(builtTx).toBe(expected)
      expect(buildTransactionMock).toHaveBeenLastCalledWith(txIntent)
      expect(mockTrack).nthCalledWith(1, {
        eventUpdateType: TransactionTrackingEventType.BUILT,
        transactionState: expected,
      })
    })
    it('should fail to build tx and call trackError', async () => {
      const expected = 'built tx error'

      buildTransactionMock.mockReturnValueOnce(err(expected))

      const errors = (await buildTx(txIntent))._unsafeUnwrapErr()

      expect(errors).toBeDefined()

      expect(buildTransactionMock).toHaveBeenLastCalledWith(txIntent)

      expect(mockTrackError).lastCalledWith({
        inStep: TransactionTrackingEventType.BUILT,
        errors: expected,
      })
    })
  })

  describe('happy paths', () => {
    it('should send tx', async () => {
      buildTransactionMock.mockReturnValueOnce(
        ok({ transaction: { blob: '' } }),
      )
      signMock.mockReturnValueOnce(ok('signedTx'))
      finalizeTransactionMock.mockReturnValueOnce(ok('finalizedTx'))
      submitSignedTransactionMock.mockReturnValueOnce(
        ok({ txID: { toPrimitive: () => 'submittedTx' } }),
      )
      transactionStatusMock.mockReturnValue(
        ResultAsync.fromPromise(
          Promise.resolve({
            status: TransactionStatus.CONFIRMED,
            txID: { toPrimitive: () => 'confirmedTx' },
          }),
          e => e,
        ),
      )

      const tx = await sendTransaction({
        account: mockAccount,
        txIntent,
        radixAPI: mockRadixApi,
        network: Network.MAINNET,
        options: {},
      }).completion

      expect(tx._unsafeUnwrap().toPrimitive()).toBe('confirmedTx')
      expect(buildTransactionMock).toHaveBeenCalled()
      expect(signMock).toHaveBeenCalled()
      expect(finalizeTransactionMock).toHaveBeenCalled()
      expect(submitSignedTransactionMock).toHaveBeenCalled()
      expect(transactionStatusMock).toHaveBeenCalled()
    })
  })

  describe('unhappy paths', () => {
    it('should handle signTx error', async () => {
      const errorMsg = new Error(
        'Failed to sign tx with Ledger, underlying error while streaming tx bytes',
      )

      const expected = {
        errors: [
          radixAPIError({
            details: { type: 'SignTransactionError' },
            message: errorMsg.message,
          }),
        ],
        eventUpdateType: 'SIGNED',
      }
      buildTransactionMock.mockReturnValueOnce(
        ok({ transaction: { blob: '' } }),
      )
      signMock.mockReturnValue(
        ResultAsync.fromPromise(Promise.reject(errorMsg), e => e),
      )
      const tx = await sendTransaction({
        account: mockAccount,
        txIntent,
        radixAPI: mockRadixApi,
        network: Network.MAINNET,
        options: {},
      }).completion

      if (tx.isErr()) {
        expect(tx._unsafeUnwrapErr()).toEqual(expected)
      } else {
        expect(true).toBe(false)
      }
    })
  })
})
