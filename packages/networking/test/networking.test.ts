import { RPCClient } from '../src/json-rpc'
import { TokenBalancesResponse } from '../src/_types'

describe('networking', () => {
	describe('json-rpc', () => {
		it('should', async () => {
			const client = RPCClient(new URL('http://localhost:3333/'))
			const mockAddress = 'xyz'

			const expected: TokenBalancesResponse = {
				owner: '',
				tokenBalances: [
					{
						token: '',
						amount: ''
					}
				]
			}

			const result = await client.tokenBalances(mockAddress)
			
			expect(result).toMatchObject<TokenBalancesResponse>(expected)
			
		})
	})
})
