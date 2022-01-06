import {
	AccountT,
	TransactionIntent,
	TransactionTrackingEventType,
} from '@application'
import { ResultAsync } from 'neverthrow'
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

const buildTx = _buildTx({
	radixAPI: mockRadixApi,
	account: mockAccount,
	track: mockTrack,
	trackError: mockTrackError,
})

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

		buildTransactionMock.mockReturnValueOnce(
			ResultAsync.fromSafePromise(Promise.resolve(expected)),
		)

		const builtTx$ = buildTx(txIntent)

		expect(await firstValueFrom(builtTx$)).toBe(expected)
		expect(buildTransactionMock).toHaveBeenLastCalledWith(txIntent)
		expect(mockTrack).nthCalledWith(1, {
			eventUpdateType: TransactionTrackingEventType.INITIATED,
			transactionState: txIntent,
		})
		expect(mockTrack).nthCalledWith(2, {
			eventUpdateType: TransactionTrackingEventType.BUILT_FROM_INTENT,
			transactionState: expected,
		})
	})
	it('should fail to build tx and call trackError', async () => {
		const expected = 'built tx error'
		const txIntent = {
			actions: ['action 1'],
		} as unknown as TransactionIntent

		buildTransactionMock.mockReturnValueOnce(
			ResultAsync.fromSafePromise(Promise.reject(expected)),
		)

		const builtTx$ = buildTx(txIntent)
		try {
			await firstValueFrom(builtTx$)
			expect(true).toBe(false)
		} catch (error) {
			expect(error).toBeDefined()
		}

		expect(buildTransactionMock).toHaveBeenLastCalledWith(txIntent)
		expect(mockTrack).lastCalledWith({
			eventUpdateType: TransactionTrackingEventType.INITIATED,
			transactionState: txIntent,
		})
		expect(mockTrackError).lastCalledWith({
			inStep: TransactionTrackingEventType.BUILT_FROM_INTENT,
			error: expected,
		})
	})
})
