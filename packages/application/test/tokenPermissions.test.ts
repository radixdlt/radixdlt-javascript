import { tokenOwnerOnly } from '@radixdlt/application/dist/tokenPermissions'
import { TokenPermission } from '../src/_types'

describe('tokenPermissions', () => {
	it(`has a default preset which 'mint' transition permissions`, () => {
		expect(tokenOwnerOnly.mintPermission.valueOf()).toBe(
			TokenPermission.TOKEN_OWNER_ONLY,
		)
	})
})
