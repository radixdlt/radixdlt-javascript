import { resourceIdentifierFromString } from '../src/resourceIdentifier'
import {
	isResourceIdentifierParticle,
	resourceIdentifierParticle,
} from '../src/resourceIdentifierParticle'

describe('ResourceIdentifierParticle', () => {
	it('can be created from an resource identifier', () => {
		const rriParticle = resourceIdentifierParticle(rri)
		expect(rriParticle.alwaysZeroNonce.value.equals(0)).toBe(true)
		expect(rriParticle.resourceIdentifier.name).toBe('FOOBAR')
		expect(isResourceIdentifierParticle(rriParticle)).toBe(true)
	})

	const rri = resourceIdentifierFromString(
		'/9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT/FOOBAR',
	)._unsafeUnwrap()
})
