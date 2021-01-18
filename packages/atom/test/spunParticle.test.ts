import {
	SpunParticle,
	Spin,
	AnySpunParticle,
	TransferrableTokensParticle,
} from '../src/_types'
import {
	asAnyDownParticle,
	asAnyUpParticle,
	asDownParticle,
	asUpParticle,
	spunParticle,
} from '../src/spunParticle'
import {
	transferrableTokensParticleFromUnsafe,
	unallocatedTokensParticleFromUnsafe,
} from './utility'

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

		const asUpParticleResult = asUpParticle(spunTTP)
		expect(asUpParticleResult.isOk()).toBe(true)
		const upParticle = asUpParticleResult._unsafeUnwrap()
		testSpunParticleOfTypeTTP(upParticle)

		const asAnyUpParticleResult = asAnyUpParticle(spunTTP)
		expect(asAnyUpParticleResult.isOk()).toBe(true)
		const anyUpParticle = asAnyUpParticleResult._unsafeUnwrap()
		testSpunParticleOfTypeTTP(anyUpParticle)

		expect(asDownParticle(spunTTP).isErr()).toBe(true)
		expect(asAnyDownParticle(spunTTP).isErr()).toBe(true)
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
