import {
	AnyUpParticle,
	asUpParticle,
	Spin,
	spunParticles,
	TransferrableTokensParticle,
	UpParticle,
} from '@radixdlt/atom'
import { Address } from '@radixdlt/crypto'
import { Result } from 'neverthrow'

export const collectUpParticles = (
	input: Readonly<{
		upParticles: AnyUpParticle[]
		addressOfActiveAccount: Address
	}>,
): Result<UpParticle<TransferrableTokensParticle>, Error>[] => {
	return spunParticles(input.upParticles)
		.transferrableTokensParticles(Spin.UP)
		.filter((sp) =>
			sp.particle.address.equals(input.addressOfActiveAccount),
		)
		.map((sp) => asUpParticle(sp))
}
