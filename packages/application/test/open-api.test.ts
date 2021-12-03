import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

import { openApiClient } from '@radixdlt/networking/src'
import { getAPI } from '../src/api/open-api/interface'

const BASE_URL = 'https://localhost:9000'

const api = getAPI(openApiClient(new URL(BASE_URL)).call)

const mock = new MockAdapter(axios)

describe.skip('handle error responses', () => {
	afterEach(() => {
		mock.reset()
	})

	it('should throw if 500 error', async () => {
		mock.onPost(`${BASE_URL}/gateway`).reply(500, {})
		try {
			await api.gateway({})
			expect(true).toBe(false)
		} catch (error) {
			expect(error).toBeDefined()
		}
	})

	it.only('should handle 400 error', async done => {
		mock.onPost(`${BASE_URL}/gateway`).reply(400, {})
		api.gateway({}).map(res => {
			console.log(res)
		})
	})
})
