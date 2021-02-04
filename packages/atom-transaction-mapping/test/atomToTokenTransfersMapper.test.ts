import { toAddress } from '../../crypto/test/address.test'
import {
	atom,
	particleGroups,
	ResourceIdentifier,
	resourceIdentifierFromAddressAndName,
	transferrableTokensParticle,
	upParticle,
} from '@radixdlt/atom'
import { transferTokensAction } from '@radixdlt/actions'
import {
	Amount,
	amountInSmallestDenomination,
	maxAmount,
	three,
} from '@radixdlt/primitives'
import { tokenTransferActionToParticleGroupsMapper } from '../src/toAtom/tokenTransferActionToParticleGroupsMapper'

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

	const aliceCoin = resourceIdentifierFromAddressAndName({
		address: alice,
		name: 'ALICE',
	})

	it('should work with change', () => {
		const transferToPGsMapper = tokenTransferActionToParticleGroupsMapper()
		const transferTokensAction_ = transferTokensAction({
			from: alice,
			to: bob,
			amount: three,
			resourceIdentifier: aliceCoin,
		})
		// const groups = transferToPGsMapper.particleGroupsFromAction({
		// 	action: transferTokensAction_,
		// 	upParticles: [upParticle(transferrableTokensParticle({
		// 		amount: maxAmount,
		// 		resourceIdentifier: aliceCoin,
		// 		address: alice,
		// 	})._unsafeUnwrap()).eraseToAnyUp()],
		// 	addressOfActiveAccount: alice
		// })
		// const atom_ = atom({ particleGroups: particleGroups(groups) })
	})
})
