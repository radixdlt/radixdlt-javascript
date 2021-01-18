import { SpunParticle, Spin, TransferrableTokensParticle } from '../src/_types'
import { spunParticle } from '../src/spunParticle'
import {
	transferrableTokensParticleFromUnsafe,
	unallocatedTokensParticleFromUnsafe,
} from './utility'
import { AnySpunParticle } from '../dist/_types'

describe('SpunParticle', () => {
	it('can create SpunParticle<TransferrableTokensParticle>', () => {
		const spunTTP = spunParticle({
			particle: transferrableTokensParticle,
			spin: Spin.UP,
		})

		const testSpunParticleOfTypeTTP = (particle: AnySpunParticle) => {
			expect(particle.spin).toBe(Spin.UP)
			expect(particle.particle).toBe(transferrableTokensParticle)
			expect(particle.particleType).toBe('TransferrableTokensParticle')
		}

		testSpunParticleOfTypeTTP(spunTTP)
		testSpunParticleOfTypeTTP(spunTTP.eraseToAny())
	})

	it('can create SpunParticle<UnallocatedTokensParticle>', () => {
		const spunUATP = spunParticle({
			particle: unallocatedTokensParticle,
			spin: Spin.DOWN,
		})

		const testSpunParticleOfTypeUATP = (particle: AnySpunParticle) => {
			expect(spunUATP.spin).toBe(Spin.DOWN)
			expect(spunUATP.particle).toBe(unallocatedTokensParticle)
			expect(spunUATP.particleType).toBe('UnallocatedTokensParticle')
		}

		testSpunParticleOfTypeUATP(spunUATP)
		testSpunParticleOfTypeUATP(spunUATP.eraseToAny())
	})
})

const transferrableTokensParticle = transferrableTokensParticleFromUnsafe({
	address: '9S9LHeQNFpNJYqLtTJeAbos1LCC5Q7HBiGwPf2oju3NRq5MBKAGt',
	tokenDefinitionReference:
		'/9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT/FOOBAR',
	granularity: 3,
	amount: 9,
})._unsafeUnwrap()

const unallocatedTokensParticle = unallocatedTokensParticleFromUnsafe({
	tokenDefinitionReference:
		'/9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT/FOOBAR',
	granularity: 3,
	amount: 9,
})._unsafeUnwrap()
