import { toAddress } from '../../crypto/test/address.test'
import {
	anyUpParticle,
	particleGroups,
	Spin,
	spunParticle,
	spunUpParticle,
	TokenDefinitionParticleBase,
	particleGroup,
	Atom,
} from '@radixdlt/atom'
import {
	TransferTokensAction,
	transferTokensAction,
	TransferTokensActionInput,
} from '@radixdlt/actions'
import {
	Amount,
	AmountT,
	five,
	Granularity,
	isAmount,
	maxAmount,
	one,
	three,
	two,
} from '@radixdlt/primitives'
import { tokenTransferActionToParticleGroupsMapper } from '../src/toAtom/tokenTransferActionToParticleGroupsMapper'
import {
	syncMapAtomToTokenTransfers as mapAtomToTokenTransfers,
	pgToTokenTransfer,
} from '../src/fromAtom/atomToTokenTransfersMapper'
import { Address, AddressT } from '@radixdlt/crypto'
import { UInt256 } from '@radixdlt/uint256'
import { TokenTransfer } from '../src/fromAtom/_types'
import { unallocatedTokensParticleFromUnsafe } from '../../atom/test/helpers/utility'
import { ResourceIdentifierT } from '@radixdlt/atom/src/_types'
import {
	SpunParticleT,
	TransferrableTokensParticleT,
	UnallocatedTokensParticleT,
} from '@radixdlt/atom/src/particles/_types'
import {
	FixedSupplyTokenDefinitionParticle,
	TransferrableTokensParticle,
} from '@radixdlt/atom/src/_index'

describe('AtomToTokenTransfersMapper', () => {
	const alice = toAddress(
		'9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT',
	)
	const bob = toAddress(
		'9S9LHeQNFpNJYqLtTJeAbos1LCC5Q7HBiGwPf2oju3NRq5MBKAGt',
	)
	const carol = toAddress(
		'9S8sKfN3wGyJdfyu9RwWvGKtZqq3R1NaxwT63VXi5dEZ6dUJXLyR',
	)

	const granularity: Granularity = one
	const fixedSupplyTokenDefinitionParticle_ = FixedSupplyTokenDefinitionParticle.create(
		{
			granularity,
			supply: maxAmount,
			symbol: 'ALICE',
			name: 'AliceCoin',
			address: alice,
		},
	)._unsafeUnwrap()
	const aliceCoin = fixedSupplyTokenDefinitionParticle_.resourceIdentifier

	type AmountLike = number | AmountT
	const makeAmount = (amount: AmountLike): AmountT =>
		isAmount(amount)
			? amount
			: Amount.inSmallestDenomination(UInt256.valueOf(amount))

	const makeTTPWithSpin = (
		spin: Spin,
		resourceIdentifier: ResourceIdentifierT,
		owner: AddressT,
		amount: AmountLike,
	): SpunParticleT<TransferrableTokensParticleT> => {
		return spunParticle({
			particle: TransferrableTokensParticle.create({
				amount: makeAmount(amount),
				granularity,
				resourceIdentifier: resourceIdentifier,
				address: owner,
			})._unsafeUnwrap(),
			spin: spin,
		})
	}

	const makeUnallocatedTokenParticleWithSpin = (
		spin: Spin,
		resourceIdentifier: ResourceIdentifierT,
		amount: AmountLike,
	): SpunParticleT<UnallocatedTokensParticleT> => {
		return spunParticle({
			particle: unallocatedTokensParticleFromUnsafe({
				amount: makeAmount(amount),
				granularity,
				resourceIdentifier: resourceIdentifier,
			})._unsafeUnwrap(),
			spin: spin,
		})
	}

	const upTTP = makeTTPWithSpin.bind(null, Spin.UP)
	const downTTP = makeTTPWithSpin.bind(null, Spin.DOWN)

	type TransferTokensActionInputIsh = Omit<
		TransferTokensActionInput,
		'resourceIdentifier' | 'amount'
	>
	const makeTransferWithRRI = (
		input: TransferTokensActionInputIsh & { amount: AmountLike },
	): ((_: ResourceIdentifierT) => TransferTokensAction) => (
		rri: ResourceIdentifierT,
	): TransferTokensAction =>
		transferTokensAction({
			...input,
			amount: makeAmount(input.amount),
			resourceIdentifier: rri,
		})

	const expectSuccess = <T extends TokenDefinitionParticleBase>(
		tokenDefinitionParticle: T,
		makeTransfer: (rri: ResourceIdentifierT) => TransferTokensAction,
		consumablesFromAmounts: AmountLike[],
		filterTokenTransfersForAcccount: AddressT,
		validateTransfers: (tokenTransfers: TokenTransfer[]) => void,
	): void => {
		const resourceID = tokenDefinitionParticle.resourceIdentifier
		const transferAction: TransferTokensAction = makeTransfer(resourceID)
		const actor = transferAction.sender

		const transferToPGsMapper = tokenTransferActionToParticleGroupsMapper()

		const upTTPs = consumablesFromAmounts
			.map(upTTP.bind(null, resourceID, actor))
			// @ts-ignore
			.map((sp) => sp.eraseToAny())

		const upParticles = [
			spunUpParticle(tokenDefinitionParticle).eraseToAny(),
		].concat(upTTPs)

		const groups = transferToPGsMapper
			.particleGroupsFromAction({
				action: transferAction,
				upParticles: upParticles.map((sp) =>
					anyUpParticle(sp.particle),
				),
				addressOfActiveAccount: actor,
			})
			._unsafeUnwrap()

		const particleGroups_ = particleGroups(groups)
		const atom_ = Atom.create({ particleGroups: particleGroups_ })

		const tokenTransfers = mapAtomToTokenTransfers({
			atom: atom_,
			addressOfActiveAccount: filterTokenTransfersForAcccount,
		})
		validateTransfers(tokenTransfers)
	}

	const validateSingleTransfer = (
		expectedSender: AddressT,
		expectedRecipient: AddressT,
		expectedAmount: AmountT,
		expectedResourceIdentifer: ResourceIdentifierT,
	): ((_: TokenTransfer[]) => void) => (transfers: TokenTransfer[]): void => {
		expect(transfers.length).toBe(1)
		const tokenTransfer = transfers[0]
		expectAddressesEqual(tokenTransfer.from, expectedSender)
		expectAddressesEqual(tokenTransfer.to, expectedRecipient)
		expectAmountsEqual(tokenTransfer.tokenAmount.amount, expectedAmount)
		expectResourceIdentifiersEqual(
			tokenTransfer.tokenAmount.token.resourceIdentifier,
			expectedResourceIdentifer,
		)
	}

	it('should work with a single transfer with change', () => {
		const amountToTransfer = five
		expectSuccess(
			fixedSupplyTokenDefinitionParticle_,
			makeTransferWithRRI({
				amount: amountToTransfer,
				from: alice,
				to: bob,
			}),
			[one, two, three],
			alice,
			validateSingleTransfer(alice, bob, amountToTransfer, aliceCoin),
		)
	})

	it('should work with a single transfer without change', () => {
		const amountToTransfer = three
		expectSuccess(
			fixedSupplyTokenDefinitionParticle_,
			makeTransferWithRRI({
				amount: amountToTransfer,
				from: alice,
				to: bob,
			}),
			[one, two],
			alice,
			validateSingleTransfer(alice, bob, amountToTransfer, aliceCoin),
		)
	})

	it('should return empty list when filterering on a third party address', () => {
		expectSuccess(
			fixedSupplyTokenDefinitionParticle_,
			makeTransferWithRRI({
				amount: three,
				from: alice,
				to: bob,
			}),
			[one, two],
			carol, // <--- Neither sender nor recipient
			(transfers) => {
				expect(transfers.length).toBe(0)
			},
		)
	})

	it('should return one transfer when filterering on recipient', () => {
		const amountToTransfer = three
		expectSuccess(
			fixedSupplyTokenDefinitionParticle_,
			makeTransferWithRRI({
				amount: amountToTransfer,
				from: alice,
				to: bob,
			}),
			[one, two],
			bob, // <-- Recipient instead of sender
			validateSingleTransfer(alice, bob, amountToTransfer, aliceCoin),
		)
	})

	const makeUpTTP = upTTP.bind(null, aliceCoin)
	const makeDownTTP = downTTP.bind(null, aliceCoin)
	it('should fail with a PG containing 3 participants', () => {
		const weirdParticleGroup = particleGroup([
			makeUpTTP(alice, five),
			makeDownTTP(alice, one),
			makeUpTTP(bob, one),

			makeDownTTP(alice, two),
			makeUpTTP(carol, two),
		])

		const transfersResult = pgToTokenTransfer(weirdParticleGroup)
		transfersResult.match(
			() => {
				throw Error('expected error, but got none')
			},
			(f) =>
				expect(f.message).toBe(
					'A transfer should have one or two receivers. Unable to parse.',
				),
		)
	})

	it('should fail with a PG containing down TTPs from multiple addresses', () => {
		const weirdParticleGroup = particleGroup([
			makeDownTTP(alice, one),
			makeDownTTP(bob, two),
		])

		const transfersResult = pgToTokenTransfer(weirdParticleGroup)
		transfersResult.match(
			() => {
				throw Error('expected error, but got none')
			},
			(f) => expect(f.message).toBe('Incorrect number of senders.'),
		)
	})

	it('should fail with a PG containing an UnallocatedTokenParticle', () => {
		const burnActionParticleGroup = particleGroup([
			makeUpTTP(alice, three),
			makeDownTTP(alice, three),
			makeUnallocatedTokenParticleWithSpin(
				Spin.UP,
				aliceCoin,
				three,
			).eraseToAny(),
		])

		const transfersResult = pgToTokenTransfer(burnActionParticleGroup)
		transfersResult.match(
			() => {
				throw Error('expected error, but got none')
			},
			(f) =>
				expect(f.message).toBe(
					'Action seems to be a burn action, which we will omit and not count as a transfer.',
				),
		)
	})
})

const expectAddressesEqual = (lhs: AddressT, rhs: AddressT): void => {
	expect(lhs.toString()).toBe(rhs.toString())
}

const expectAmountsEqual = (lhs: AmountT, rhs: AmountT): void => {
	expect(lhs.toString()).toBe(rhs.toString())
}

const expectResourceIdentifiersEqual = (
	lhs: ResourceIdentifierT,
	rhs: ResourceIdentifierT,
): void => {
	expect(lhs.toString()).toBe(rhs.toString())
}
