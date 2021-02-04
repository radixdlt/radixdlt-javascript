import {
	asAnyDownParticle,
	asAnyUpParticle,
	asDownParticle,
	asUpParticle,
	spunParticle,
	spunUpParticle,
} from '../src/particles/spunParticle'
import {
	transferrableTokensParticleFromUnsafe,
	unallocatedTokensParticleFromUnsafe,
} from './helpers/utility'
import { isTransferrableTokensParticle } from '../src/particles/transferrableTokensParticle'
import { isUnallocatedTokensParticle } from '../src/particles/unallocatedTokensParticle'
import { Spin, SpunParticleBase } from '../src/particles/_types'

describe('SpunParticle', () => {
	it('can create SpunParticle<TransferrableTokensParticle>', () => {
		const spunTTP = spunParticle({
			particle: transferrableTokensParticle,
			spin: Spin.UP,
		})

		const assertTTPWithSpin = (
			spunParticle: SpunParticleBase,
			spin: Spin,
		) => {
			expect(spunParticle.spin).toBe(spin)
			expect(spunParticle.particle).toBe(transferrableTokensParticle)
			expect(isTransferrableTokensParticle(spunParticle.particle)).toBe(
				true,
			)
		}

		const assertTTPWithSpinUp = (particle: SpunParticleBase) => {
			assertTTPWithSpin(particle, Spin.UP)
		}

		assertTTPWithSpinUp(spunTTP)
		assertTTPWithSpinUp(spunUpParticle(transferrableTokensParticle))
		assertTTPWithSpinUp(spunTTP.eraseToAny())

		const asUpParticleResult = asUpParticle(spunTTP)
		expect(asUpParticleResult.isOk()).toBe(true)
		const upParticle = asUpParticleResult._unsafeUnwrap()
		assertTTPWithSpinUp(upParticle)

		const asAnyUpParticleResult = asAnyUpParticle(spunTTP)
		expect(asAnyUpParticleResult.isOk()).toBe(true)
		const anyUpParticle = asAnyUpParticleResult._unsafeUnwrap()
		assertTTPWithSpinUp(anyUpParticle)

		expect(asDownParticle(spunTTP).isErr()).toBe(true)
		expect(asAnyDownParticle(spunTTP).isErr()).toBe(true)

		const downedResult = spunTTP.downed()
		expect(downedResult.isOk()).toBe(true)
		const downedTTP = downedResult._unsafeUnwrap()
		assertTTPWithSpin(downedTTP, Spin.DOWN)
	})

	it('can create SpunParticle<UnallocatedTokensParticle>', () => {
		const spunUATP = spunParticle({
			particle: unallocatedTokensParticle,
			spin: Spin.DOWN,
		})

		const testSpunParticleOfTypeUATP = (
			spunParticleLike: SpunParticleBase,
		) => {
			expect(spunParticleLike.spin).toBe(Spin.DOWN)
			expect(spunParticleLike.particle).toBe(unallocatedTokensParticle)
			expect(isUnallocatedTokensParticle(spunParticleLike.particle)).toBe(
				true,
			)
		}

		testSpunParticleOfTypeUATP(spunUATP)
		testSpunParticleOfTypeUATP(spunUATP.eraseToAny())

		expect(spunUATP.downed().isErr()).toBe(true)

		const asDownParticleResult = asDownParticle(spunUATP)
		expect(asDownParticleResult.isOk()).toBe(true)
		const asDownParticleUATP = asDownParticleResult._unsafeUnwrap()
		testSpunParticleOfTypeUATP(asDownParticleUATP)

		const asAnyDownParticleResult = asAnyDownParticle(spunUATP)
		expect(asAnyDownParticleResult.isOk()).toBe(true)
		const asAnyDownParticleUATP = asAnyDownParticleResult._unsafeUnwrap()
		testSpunParticleOfTypeUATP(asAnyDownParticleUATP)
	})
})

const transferrableTokensParticle = transferrableTokensParticleFromUnsafe({
	address: '9S9LHeQNFpNJYqLtTJeAbos1LCC5Q7HBiGwPf2oju3NRq5MBKAGt',
	resourceIdentifier:
		'/9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT/FOOBAR',
	granularity: 3,
	amount: 9,
})._unsafeUnwrap()

const unallocatedTokensParticle = unallocatedTokensParticleFromUnsafe({
	resourceIdentifier:
		'/9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT/FOOBAR',
	granularity: 3,
	amount: 9,
})._unsafeUnwrap()
