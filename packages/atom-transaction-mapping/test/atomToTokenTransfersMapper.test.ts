import { toAddress } from '../../crypto/test/address.test'
import {
	AnyUpParticle,
	atom,
	fixedSupplyTokenDefinitionParticle,
	particleGroups,
	ResourceIdentifier,
	TokenDefinitionParticleBase,
	transferrableTokensParticle,
	upParticle,
} from '@radixdlt/atom'
import {
	TransferTokensAction,
	transferTokensAction,
	TransferTokensActionInput,
} from '@radixdlt/actions'
import {
	Amount,
	amountInSmallestDenomination,
	five,
	Granularity,
	isAmount,
	maxAmount,
	one,
	three,
	two,
} from '@radixdlt/primitives'
import { tokenTransferActionToParticleGroupsMapper } from '../src/toAtom/tokenTransferActionToParticleGroupsMapper'
import { syncMapAtomToTokenTransfers as mapAtomToTokenTransfers } from '../src/fromAtom/atomToTokenTransfersMapper'
import { Address } from '@radixdlt/crypto'
import { UInt256 } from '@radixdlt/uint256'
import { TokenTransfer } from '../src/fromAtom/_types'

describe('AtomToTokenTransfersMapper', () => {
	const alice = toAddress(
		'9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT',
	)
	const bob = toAddress(
		'9S9LHeQNFpNJYqLtTJeAbos1LCC5Q7HBiGwPf2oju3NRq5MBKAGt',
	)

	const granularity: Granularity = one
	const fixedSupplyTokenDefinitionParticle_ = fixedSupplyTokenDefinitionParticle(
		{
			granularity,
			supply: maxAmount,
			symbol: 'ALICE',
			name: 'AliceCoin',
			address: alice,
		},
	)._unsafeUnwrap()
	const aliceCoin = fixedSupplyTokenDefinitionParticle_.resourceIdentifier

	type AmountLike = number | Amount
	const makeAmount = (amount: AmountLike): Amount =>
		isAmount(amount)
			? amount
			: amountInSmallestDenomination(UInt256.valueOf(amount))

	const upTTP = (
		resourceIdentifier: ResourceIdentifier,
		owner: Address,
		amount: AmountLike,
	): AnyUpParticle => {
		return upParticle(
			transferrableTokensParticle({
				amount: makeAmount(amount),
				granularity,
				resourceIdentifier: resourceIdentifier,
				address: owner,
			})._unsafeUnwrap(),
		).eraseToAnyUp()
	}

	type TransferTokensActionInputIsh = Omit<
		TransferTokensActionInput,
		'resourceIdentifier' | 'amount'
	>
	const makeTransferWithRRI = (
		input: TransferTokensActionInputIsh & { amount: AmountLike },
	): ((_: ResourceIdentifier) => TransferTokensAction) => (
		rri: ResourceIdentifier,
	): TransferTokensAction =>
		transferTokensAction({
			...input,
			amount: makeAmount(input.amount),
			resourceIdentifier: rri,
		})._unsafeUnwrap()

	const expectSuccess = <T extends TokenDefinitionParticleBase>(
		tokenDefinitionParticle: T,
		makeTransfer: (rri: ResourceIdentifier) => TransferTokensAction,
		consumablesFromAmounts: AmountLike[],
		filterTokenTransfersForAcccount: Address,
		validateTransfers: (tokenTransfers: TokenTransfer[]) => void,
	): void => {
		const resourceID = tokenDefinitionParticle.resourceIdentifier
		const transferAction: TransferTokensAction = makeTransfer(resourceID)
		const actor = transferAction.sender

		const transferToPGsMapper = tokenTransferActionToParticleGroupsMapper()
		const upTTPs: AnyUpParticle[] = consumablesFromAmounts.map(
			upTTP.bind(null, resourceID, actor),
		)

		const upParticles = [
			upParticle(tokenDefinitionParticle).eraseToAnyUp(),
		].concat(upTTPs)

		const groups = transferToPGsMapper
			.particleGroupsFromAction({
				action: transferAction,
				upParticles: upParticles,
				addressOfActiveAccount: actor,
			})
			._unsafeUnwrap()

		const particleGroups_ = particleGroups(groups)
		const atom_ = atom({ particleGroups: particleGroups_ })

		const tokenTransfers = mapAtomToTokenTransfers({
			atom: atom_,
			addressOfActiveAccount: filterTokenTransfersForAcccount,
		})
		validateTransfers(tokenTransfers)
	}

	const validateSingleTransfer = (
		expectedSender: Address,
		expectedRecipient: Address,
		expectedAmount: Amount,
		expectedResourceIdentifer: ResourceIdentifier,
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
})

const expectAddressesEqual = (lhs: Address, rhs: Address): void => {
	expect(lhs.toString()).toBe(rhs.toString())
}

const expectAmountsEqual = (lhs: Amount, rhs: Amount): void => {
	expect(lhs.toString()).toBe(rhs.toString())
}

const expectResourceIdentifiersEqual = (
	lhs: ResourceIdentifier,
	rhs: ResourceIdentifier,
): void => {
	expect(lhs.toString()).toBe(rhs.toString())
}
