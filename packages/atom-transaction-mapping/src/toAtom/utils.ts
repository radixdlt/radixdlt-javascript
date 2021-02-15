import {
	AnyUpParticle,
	asUpParticle,
	Spin,
	spunParticles,
	transferrableTokensParticle,
	TransferrableTokensParticle,
	UpParticle,
} from '@radixdlt/atom'
import { Address } from '@radixdlt/account'
import { Result } from 'neverthrow'
import { Amount } from '@radixdlt/primitives'

export const transferrableTokensParticleFromOther = (
	address: Address,
	amount: Amount,
	from: TransferrableTokensParticle,
): Result<TransferrableTokensParticle, Error> =>
	transferrableTokensParticle({
		...from,
		amount,
		address,
		nonce: undefined, // IMPORTANT to not reuse nonce.
	})

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
