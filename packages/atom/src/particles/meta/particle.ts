import { RadixParticle } from '../_types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ParticleEquals = (p1: any, p2: any) => boolean

const withEquals = (...equalFns: ParticleEquals[]) => (p: RadixParticle) => ({
	...p,
	equals: (otherParticle: RadixParticle) =>
		!equalFns.some((fn) => !fn(otherParticle, p)),
})

export const withParticleEquals = withEquals.bind(
	null,
	(p1: RadixParticle, p2: RadixParticle) =>
		p1.radixParticleType === p2.radixParticleType,
)
