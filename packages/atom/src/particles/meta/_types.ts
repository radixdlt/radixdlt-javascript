import { Nonce } from '@radixdlt/primitives'
import { ResourceIdentifier } from '../../_types'

export type ParticleInput = Readonly<{
	tokenDefinitionReference: ResourceIdentifier
	nonce?: Nonce
}>
