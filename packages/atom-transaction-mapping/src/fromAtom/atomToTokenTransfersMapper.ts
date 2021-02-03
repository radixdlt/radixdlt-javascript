import { Atom } from '@radixdlt/atom'
import { Address } from '@radixdlt/crypto'
import {
	AtomToTokenTransfersMapper,
	ExecutedUserActionType,
	TokenTransfer,
} from './_types'
import { Observable } from 'rxjs'

export const makeAtomToTokenTransfersMapper = (): AtomToTokenTransfersMapper => {
	return <AtomToTokenTransfersMapper>{
		executedUserActionType: ExecutedUserActionType.TOKEN_TRANSFER,

		map: (
			_input: Readonly<{
				atom: Atom
				addressOfActiveAccount: Address
			}>,
		): Observable<TokenTransfer> => {
			return new Observable((subscriber) => {
				subscriber.error(new Error('Implement me'))
			})
		},
	}
}
