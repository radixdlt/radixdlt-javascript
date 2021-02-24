import { PublicKey, isPublicKey } from '@radixdlt/crypto'
import { BIP32T } from './_index'
import {
	AccountIdT,
	AccountIdFromBIP32Path,
	AccountIdFromPublicKey,
} from './_types'

const isFromBIP32Path = (
	something: unknown,
): something is AccountIdFromBIP32Path => {
	const inspection = something as AccountIdFromBIP32Path
	return (
		inspection.accountIdString !== undefined &&
		inspection.accountIdString === 'AccountIdFromBIP32Path' &&
		inspection.accountIdString !== undefined
	)
}

const isFromPublicKey = (
	something: unknown,
): something is AccountIdFromPublicKey => {
	const inspection = something as AccountIdFromPublicKey
	return (
		inspection.accountIdString !== undefined &&
		inspection.accountIdString === 'AccountIdFromPublicKey' &&
		inspection.accountIdString !== undefined
	)
}

export const isAccountID = (something: unknown): something is AccountIdT => {
	if (isFromBIP32Path(something)) return true
	return !!isFromPublicKey(something)
}

const fromBIP32Path = (hdPath: BIP32T): AccountIdT => ({
	type: 'AccountIdFromBIP32Path',
	accountIdString: hdPath.toString(),
})

const fromPublicKey = (publicKey: PublicKey): AccountIdT => ({
	type: 'AccountIdFromPublicKey',
	accountIdString: publicKey.toString(),
})

const create = (id: AccountIdT | PublicKey | BIP32T): AccountIdT => {
	if (isAccountID(id)) return id
	if (isPublicKey(id)) return fromPublicKey(id as PublicKey)
	return fromBIP32Path(id as BIP32T)
}

export const AccountId = {
	create,
}
