import { Spin, TokenBase } from '@radixdlt/atom'
import {
	AtomToActionMapperInput,
	AtomToTokenTransfersMapper,
	ExecutedUserActionType,
	TokenTransfer,
} from './_types'
import { Observable, from } from 'rxjs'
import { err, Result, ok } from 'neverthrow'
import { executedTokenTransfer } from './tokenTransfer'
import {
	ParticleGroupT,
	TransferrableTokensParticleT,
} from '@radixdlt/atom/src/_index'
import { AddressT } from '@radixdlt/account'
import { AmountT } from '@radixdlt/primitives'

const uniqueAddressCountTTPs = (
	particles: TransferrableTokensParticleT[],
): number => {
	return new Set(particles.map((ttp) => ttp.address)).size
}

type SenderTokenAndPG = Readonly<{
	particleGroup: ParticleGroupT
	from: AddressT
	tokenDefinition: TokenBase
}>

const getSenderAndToken = (
	particleGroup: ParticleGroupT,
): Result<SenderTokenAndPG, Error> => {
	const downedTTPsFromSender: TransferrableTokensParticleT[] = particleGroup
		.transferrableTokensParticles(Spin.DOWN)
		.map((sp) => sp.particle)

	if (uniqueAddressCountTTPs(downedTTPsFromSender) !== 1)
		return err(new Error('Incorrect number of senders.'))

	const downedParticleFromSender = downedTTPsFromSender[0]

	return ok({
		particleGroup: particleGroup,
		from: downedParticleFromSender.address,
		tokenDefinition: downedParticleFromSender,
	})
}

const doesPGContainUnallocatedTokensParticleWithSpinUp = (
	input: SenderTokenAndPG,
): boolean =>
	input.particleGroup
		.unallocatedTokensParticles(Spin.UP)
		.some((upP) =>
			upP.particle.resourceIdentifier.equals(
				input.tokenDefinition.resourceIdentifier,
			),
		)

const validateNotIsTransferNotBurn = (
	input: SenderTokenAndPG,
): Result<SenderTokenAndPG, Error> =>
	doesPGContainUnallocatedTokensParticleWithSpinUp(input)
		? err(
				new Error(
					'Action seems to be a burn action, which we will omit and not count as a transfer.',
				),
		  )
		: ok(input)

type ToAndAmount = Readonly<{ to: AddressT; amount: AmountT }>

const getRecipient = (
	input: SenderTokenAndPG,
): Result<{ to: AddressT; upTTPs: TransferrableTokensParticleT[] }, Error> => {
	const sender = input.from
	const particleGroup = input.particleGroup

	const upTTPs: TransferrableTokensParticleT[] = particleGroup
		.transferrableTokensParticles(Spin.UP)
		.map((sp) => sp.particle)

	const numberOfRecipients = uniqueAddressCountTTPs(upTTPs)
	if (numberOfRecipients < 1 || numberOfRecipients > 2)
		return err(
			new Error(
				'A transfer should have one or two receivers. Unable to parse.',
			),
		)

	const recipient =
		upTTPs.find((p) => !p.address.equals(sender))?.address ?? sender

	return ok({ to: recipient, upTTPs })
}

const getRecipientAndAmount = (
	input: SenderTokenAndPG,
): Result<SenderTokenAndPG & ToAndAmount, Error> =>
	getRecipient(input).map((toAndTTPWithSpinUp) => {
		const to = toAndTTPWithSpinUp.to
		const upTTPs = toAndTTPWithSpinUp.upTTPs
		const upParticleToRecipient = upTTPs.find((p) => p.address.equals(to))

		if (!upParticleToRecipient)
			throw Error('Incorrect implementation, should not happen.')

		return {
			...input,
			to,
			amount: upParticleToRecipient.amount,
		}
	})

export const pgToTokenTransfer = (
	particleGroup: ParticleGroupT,
): Result<TokenTransfer, Error> =>
	getSenderAndToken(particleGroup)
		.andThen(validateNotIsTransferNotBurn)
		.andThen(getRecipientAndAmount)
		.map(executedTokenTransfer)

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
	return {
		executedUserActionType: ExecutedUserActionType.TOKEN_TRANSFER,

		map: (input: AtomToActionMapperInput): Observable<TokenTransfer> =>
			from(syncMapAtomToTokenTransfers(input)),
	}
}
