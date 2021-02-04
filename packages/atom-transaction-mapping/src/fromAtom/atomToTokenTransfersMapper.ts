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
import { Amount, zero } from '@radixdlt/primitives'
import { err, Result } from 'neverthrow'
import { executedTokenTransfer } from './tokenTransfer'

const uniqueAddressCount = (anySpunParticles: AnySpunParticle[]): number => {
	const ttps = spunParticles(anySpunParticles).transferrableTokensParticles()
	return new Set(ttps.map((sp) => sp.particle.address)).size
}

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

// eslint-disable-next-line complexity, max-lines-per-function
const pgToTokenTransfer = (
	particleGroup: ParticleGroup,
): Result<TokenTransfer, Error> => {
	const downTTPs: DownParticle<TransferrableTokensParticle>[] = particleGroup
		.transferrableTokensParticles(Spin.DOWN)
		.map((sp) => downParticle(sp.particle))
	if (uniqueAddressCount(downTTPs) !== 1)
		return err(new Error('Incorrect number of senders'))

	const particlesFromSender: DownParticle<TransferrableTokensParticle>[] = downTTPs.map(
		(sp) => downParticle(sp.particle),
	)

	const upTTPs: UpParticle<TransferrableTokensParticle>[] = particleGroup
		.transferrableTokensParticles(Spin.UP)
		.map((sp) => upParticle(sp.particle))
	const numberOfRecipients = uniqueAddressCount(upTTPs)
	if (numberOfRecipients < 1 || numberOfRecipients > 2)
		return err(new Error('Incorrect number of recipients'))

	const firstUpParticle: UpParticle<TransferrableTokensParticle> = upParticle(
		upTTPs[0].particle,
	)

	const secondUpParticle =
		numberOfRecipients === 2 ? upParticle(upTTPs[1].particle) : undefined

	const sender = particlesFromSender[0].particle.address

	const recipientUpParticle = upTTPs.find(
		(upP) => !upP.particle.address.equals(sender),
	)
	if (!recipientUpParticle)
		return err(new Error('No transfer to another user. Unable to process'))
	const recipient = recipientUpParticle.particle.address

	const upParticleToRecipient = firstUpParticle.particle.address.equals(
		recipient,
	)
		? firstUpParticle
		: secondUpParticle
	const upParticleChangeBackToSender = firstUpParticle.particle.address.equals(
		sender,
	)
		? firstUpParticle
		: secondUpParticle

	if (!upParticleToRecipient)
		// Illegal state
		throw new Error(
			'Incorrect implementation, should have been able to identify upParticleToRecipient',
		)

	if (
		doesPGContainUnallocatedTokensParticleWithSpinUp({
			particleGroup,
			resourceIdentifier:
				upParticleToRecipient.particle.resourceIdentifier,
		})
	) {
		return err(new Error('Action seems to be a burn?'))
	}

	const amountBackToSenderOrZero =
		upParticleChangeBackToSender !== undefined
			? upParticleChangeBackToSender.particle.amount
			: zero

	return upParticleToRecipient.particle.amount
		.subtracting(amountBackToSenderOrZero)
		.map((amount: Amount) =>
			executedTokenTransfer({
				from: sender,
				to: recipient,
				amount: amount,
				tokenDefinition: upParticleToRecipient.particle,
			}),
		)
}

const valuePresent = <T>(value: T | null | undefined): value is T => {
	return value !== null && value !== undefined
}

export const syncMapAtomToTokenTransfers = (
	input: AtomToActionMapperInput,
): TokenTransfer[] => {
	return input.atom.particleGroups.groups
		.map(pgToTokenTransfer)
		.map((r) => (r.isOk() ? r.value : undefined))
		.filter(valuePresent)
}

export const makeAtomToTokenTransfersMapper = (): AtomToTokenTransfersMapper => {
	return <AtomToTokenTransfersMapper>{
		executedUserActionType: ExecutedUserActionType.TOKEN_TRANSFER,

		map: (input: AtomToActionMapperInput): Observable<TokenTransfer> =>
			from(syncMapAtomToTokenTransfers(input)),
	}
}
