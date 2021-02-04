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
		return err(
			new Error(
				'Incorrect number of recipients, a transfer should only have two participants. Unable to parse.',
			),
		)

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

	const transfer = executedTokenTransfer({
		from: sender,
		to: recipient,
		amount: upParticleToRecipient.particle.amount,
		tokenDefinition: upParticleToRecipient.particle,
	})

	return ok(transfer)
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
