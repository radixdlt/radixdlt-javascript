import { ResourceIdentifier, ResourceIdentifierParticle } from './_types'
import { nonce } from '@radixdlt/primitives'

export const resourceIdentifierParticle = (
	resourceIdentifier: ResourceIdentifier,
): ResourceIdentifierParticle => ({
	particleType: 'ResourceIdentifierParticle',
	alwaysZeroNonce: nonce(0),
	resourceIdentifier: resourceIdentifier,
})
