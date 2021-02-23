import {
	AnyUpParticle,
	asUpParticle,
	Spin,
	spunParticles,
	TransferrableTokensParticleT,
	TransferrableTokensParticle,
	UpParticle,
} from '@radixdlt/atom'
import { AddressT } from '@radixdlt/account'
import { AmountT } from '@radixdlt/primitives'
import { Result } from 'neverthrow'

export const transferrableTokensParticleFromOther = (
	address: AddressT,
	amount: AmountT,
	from: TransferrableTokensParticleT,
): Result<TransferrableTokensParticleT, Error> =>
	TransferrableTokensParticle.create({
		...from,
		permissions: from.permissions.permissions,
		amount,
		address,
		nonce: undefined, // IMPORTANT to not reuse nonce.
	})

export const collectUpParticles = (
	input: Readonly<{
		upParticles: AnyUpParticle[]
		addressOfActiveAccount: AddressT
	}>,
): Result<UpParticle<TransferrableTokensParticleT>, Error>[] => {
	return spunParticles(input.upParticles)
		.transferrableTokensParticles(Spin.UP)
		.filter((sp) =>
			sp.particle.address.equals(input.addressOfActiveAccount),
		)
		.map((sp) => asUpParticle(sp))
}
