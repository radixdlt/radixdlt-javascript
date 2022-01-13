import {
	AccountT,
	TransactionIntent,
	TransactionTrackingEventType,
} from '@application'
import { err, ok, ResultAsync } from 'neverthrow'
import { firstValueFrom } from 'rxjs'
import { RadixAPI } from '../api'
import { buildTx as _buildTx } from '../transaction/buildTx'

const buildTransactionMock = jest.fn()

const mockTrack = jest.fn()
const mockTrackError = jest.fn()

const mockAccount = { address: '123' } as unknown as AccountT

const mockRadixApi = {
	buildTransaction: () => buildTransactionMock,
} as unknown as RadixAPI

const buildTx = _buildTx(mockTrack, mockAccount, mockRadixApi, mockTrackError)

describe('buildTx', () => {
	beforeEach(() => {
		buildTransactionMock.mockReset()
		mockTrack.mockReset()
		mockTrackError.mockReset()
	})
	it('should build tx and call track twice', async () => {
		const expected = 'built tx'
		const txIntent = {
			actions: ['action 1'],
		} as unknown as TransactionIntent

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
		const txIntent = {
			actions: ['action 1'],
		} as unknown as TransactionIntent

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
