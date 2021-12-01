import { openApiClient } from '@radixdlt/networking'
import { NetworkId } from '@radixdlt/primitives'
import fetchMock from 'fetch-mock-jest'
import { getAPI } from '../src/api/open-api/interface'

const api = getAPI(openApiClient(new URL('https://radixnode.com')).call)

describe.skip('open api', () => {
	beforeEach(() => {
		fetchMock.mockReset()
	})

	it('accountBalancesPost', async () => {
		fetchMock.post('https://radixnode.com//network', {
			network: 'mainnet',
			ledger_state: {
				epoch: 1,
				round: 1,
				version: 1,
				timestamp: '2021-08-29T01:19:00.524Z',
			},
		})
		expect(
			await api.gateway({
				body: {},
			}),
		).toEqual({})
	})
})
