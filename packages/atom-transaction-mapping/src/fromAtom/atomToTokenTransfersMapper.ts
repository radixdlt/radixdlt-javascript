import {
	ParticleGroup,
	Spin,
	TransferrableTokensParticle,
	AnySpunParticle,
	UpParticle,
	DownParticle,
	spunParticles,
	downParticle,
	upParticle,
	ResourceIdentifier,
} from '@radixdlt/atom'
import {
	AtomToActionMapperInput,
	AtomToTokenTransfersMapper,
	ExecutedUserActionType,
	TokenTransfer,
} from './_types'
import { Observable, from } from 'rxjs'
import { err, Result, ok } from 'neverthrow'
import { executedTokenTransfer } from './tokenTransfer'
import { Address } from '@radixdlt/crypto/dist/_types'
import { Amount } from '@radixdlt/primitives'

const uniqueAddressCountTTPs = (
	particles: TransferrableTokensParticle[],
): number => {
	return new Set(particles.map((ttp) => ttp.address)).size
}

// const uniqueAddressCount = (anySpunParticles: AnySpunParticle[]): number => uniqueAddressCountTTPs(spunParticles(anySpunParticles).transferrableTokensParticles().map())

const doesPGContainUnallocatedTokensParticleWithSpinUp = (
	input: Readonly<{
		particleGroup: ParticleGroup
		resourceIdentifier: ResourceIdentifier
	}>,
): boolean =>
	input.particleGroup
		.unallocatedTokensParticles(Spin.UP)
		.some((upP) =>
			upP.particle.resourceIdentifier.equals(input.resourceIdentifier),
		)

const getRecipientAndAmount = (
	sender: Address,
	particleGroup: ParticleGroup,
): Result<{ to: Address; amount: Amount }, Error> => {
	const upTTPs: TransferrableTokensParticle[] = particleGroup
		.transferrableTokensParticles(Spin.UP)
		.map((sp) => sp.particle)

	const numberOfRecipients = uniqueAddressCountTTPs(upTTPs)
	if (numberOfRecipients < 1 || numberOfRecipients > 2)
		return err(
			new Error(
				'Incorrect number of recipients, a transfer should only have two participants. Unable to parse.',
			),
		)

	const recipient =
		upTTPs.find((p) => !p.address.equals(sender))?.address ?? sender

	const upParticleToRecipient = upTTPs.find((p) =>
		p.address.equals(recipient),
	)

	if (!upParticleToRecipient)
		throw Error('Incorrect implementation, should not happen.')

	return ok({
		to: recipient,
		amount: upParticleToRecipient.amount,
	})
}

// eslint-disable-next-line complexity, max-lines-per-function
export const pgToTokenTransfer = (
	particleGroup: ParticleGroup,
): Result<TokenTransfer, Error> => {
	const downedTTPsFromSender: TransferrableTokensParticle[] = particleGroup
		.transferrableTokensParticles(Spin.DOWN)
		.map((sp) => sp.particle)

	if (uniqueAddressCountTTPs(downedTTPsFromSender) !== 1)
		return err(new Error('Incorrect number of senders'))

	const downedParticleFromSender = downedTTPsFromSender[0]
	const sender = downedParticleFromSender.address
	const resourceIdentifier = downedParticleFromSender.resourceIdentifier

	if (
		doesPGContainUnallocatedTokensParticleWithSpinUp({
			particleGroup,
			resourceIdentifier,
		})
	) {
		return err(new Error('Action seems to be a burn?'))
	}

	return getRecipientAndAmount(sender, particleGroup).map((toAndAmount) =>
		executedTokenTransfer({
			...toAndAmount,
			from: sender,
			tokenDefinition: downedParticleFromSender,
		}),
	)
}

const valuePresent = <T>(value: T | null | undefined): value is T => {
	return value !== null && value !== undefined
}

const filterTransfer = (
	input: AtomToActionMapperInput,
	transfer: TokenTransfer,
): boolean => {
	const actor = input.addressOfActiveAccount
	return transfer.from.equals(actor) || transfer.to.equals(actor)
}

export const syncMapAtomToTokenTransfers = (
	input: AtomToActionMapperInput,
): TokenTransfer[] => {
	return input.atom.particleGroups.groups
		.map(pgToTokenTransfer)
		.map((r) => (r.isOk() ? r.value : undefined))
		.filter(valuePresent)
		.filter(filterTransfer.bind(null, input))
}

export const makeAtomToTokenTransfersMapper = (): AtomToTokenTransfersMapper => {
	return <AtomToTokenTransfersMapper>{
		executedUserActionType: ExecutedUserActionType.TOKEN_TRANSFER,

		map: (input: AtomToActionMapperInput): Observable<TokenTransfer> =>
			from(syncMapAtomToTokenTransfers(input)),
	}
}
