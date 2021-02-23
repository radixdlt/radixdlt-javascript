import { spunParticles } from '../../src/particles/spunParticles'
import { downParticle, upParticle } from '../../src/particles/spunParticle'

import {
	transferrableTokensParticleFromUnsafe,
	unallocatedTokensParticleFromUnsafe,
} from './utility'
import {
	AnySpunParticle,
	TransferrableTokensParticleT,
	UnallocatedTokensParticleT,
} from '../../src/particles/_types'
import { ResourceIdentifierT } from '../../src/_types'
import { ResourceIdentifier } from '../../src/resourceIdentifier'
import { ResourceIdentifierParticle } from '../../src/particles/resourceIdentifierParticle'

export const makeUATParticle = (
	resourceIdentifier: ResourceIdentifierT,
): UnallocatedTokensParticleT =>
	unallocatedTokensParticleFromUnsafe({
		resourceIdentifier: resourceIdentifier,
		granularity: 3,
		amount: 9,
	})._unsafeUnwrap()

export const makeTTParticle = (
	resourceIdentifier: ResourceIdentifierT,
): TransferrableTokensParticleT =>
	transferrableTokensParticleFromUnsafe({
		address: '9S9LHeQNFpNJYqLtTJeAbos1LCC5Q7HBiGwPf2oju3NRq5MBKAGt',
		resourceIdentifier: resourceIdentifier,
		granularity: 3,
		amount: 9,
	})._unsafeUnwrap()

export const rri0 = ResourceIdentifier.fromString(
	'/9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT/FOO',
)._unsafeUnwrap()

export const rri1 = ResourceIdentifier.fromString(
	'/9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT/BAR',
)._unsafeUnwrap()

export const rriParticle0 = ResourceIdentifierParticle.create(rri0)
export const rriParticle1 = ResourceIdentifierParticle.create(rri1)
export const uatParticle0 = makeUATParticle(rri0)
export const uatParticle1 = makeUATParticle(rri1)
export const ttParticle0 = makeTTParticle(rri0)
export const ttParticle1 = makeTTParticle(rri1)

export const rriParticle0Up = upParticle(rriParticle0)
export const rriParticle1Up = upParticle(rriParticle1)
export const rriParticle0Down = downParticle(rriParticle0)
export const rriParticle1Down = downParticle(rriParticle1)

export const uatParticle0Up = upParticle(uatParticle0)
export const uatParticle1Up = upParticle(uatParticle1)
export const uatParticle0Down = downParticle(uatParticle0)
export const uatParticle1Down = downParticle(uatParticle1)

export const ttParticle0Up = upParticle(ttParticle0)
export const ttParticle1Up = upParticle(ttParticle1)
export const ttParticle0Down = downParticle(ttParticle0)
export const ttParticle1Down = downParticle(ttParticle1)

export const spunParticles_ = spunParticles([
	rriParticle0Up,
	rriParticle1Up,
	rriParticle0Down,
	rriParticle1Down,
	uatParticle0Up,
	uatParticle1Up,
	uatParticle0Down,
	uatParticle1Down,
	ttParticle0Up,
	ttParticle1Up,
	ttParticle0Down,
	ttParticle1Down,
])

export const exactlyContainParticles = (
	input: Readonly<{
		actual: AnySpunParticle[]
		expected: AnySpunParticle[]
	}>,
): boolean => {
	const formIntersection = (
		lhs: AnySpunParticle[],
		rhs: AnySpunParticle[],
	): AnySpunParticle[] =>
		[...lhs].filter((x) => rhs.find((sp) => sp.equals(x)) !== undefined)

	const formDifference = (
		lhs: AnySpunParticle[],
		rhs: AnySpunParticle[],
	): AnySpunParticle[] =>
		[...lhs].filter((x) => rhs.find((sp) => sp.equals(x)) === undefined)

	return (
		formDifference(input.actual, input.expected).length === 0 &&
		formIntersection(input.actual, input.expected).length ===
			input.expected.length
	)
}
