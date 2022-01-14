import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

import { openApiClient } from '@networking'
import { getAPI } from '../api/open-api/interface'
import { log, LogLevel, radixError } from '@util'

const BASE_URL = 'https://localhost:9000'

const api = getAPI(openApiClient(new URL(BASE_URL)).call)

const mock = new MockAdapter(axios)

describe('handle error responses', () => {
  beforeAll(() => {
    log.setLevel(LogLevel.DEBUG)
  })
  afterEach(() => {
    mock.reset()
  })
  afterAll(() => {
    log.setLevel(LogLevel.INFO)
  })

  it('should throw if 500 error', async () => {
    mock.onPost(`${BASE_URL}/gateway`).reply(500)
    try {
      await api.gateway({})
      expect(true).toBe(false)
    } catch (error) {
      expect(error).toBeDefined()
    }
  })

  it('should handle 400 error', done => {
    const mockedError = {
      code: 400,
      message: 'The network selected is not valid.',
      details: {},
    }

    mock.onPost(`${BASE_URL}/gateway`).reply(400, mockedError)

    api
      .gateway({})
      .map(() => {
        expect(true).toBe(false)
      })
      .mapErr((err: any) => {
        expect(err).toEqual([radixError(mockedError)])
        done()
      })
  })

  it('should handle network error', async () => {
    mock.onPost(`${BASE_URL}/gateway`).networkError()
    await api
      .gateway({})
      .map(() => {
        expect(true).toBe(false)
      })
      .mapErr(error => {
        expect(error).toEqual([
          radixError({
            details: { type: 'NetworkError' },
            message: 'Network Error',
          }),
        ])
      })
  })
})
