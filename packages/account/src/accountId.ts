import { PublicKey, isPublicKey } from '@radixdlt/crypto'
import { BIP32 } from './_index'
import {
	AccountID,
	AccountIdFromBIP32Path,
	AccountIdFromPublicKey,
} from './_types'

export const isAccountIdFromBIP32Path = (
	something: unknown,
): something is AccountIdFromBIP32Path => {
	const inspection = something as AccountIdFromBIP32Path
	return (
		inspection.accountIdString !== undefined &&
		inspection.accountIdString === 'AccountIdFromBIP32Path' &&
		inspection.accountIdString !== undefined
	)
}

export const isAccountIdFromPublicKey = (
	something: unknown,
): something is AccountIdFromPublicKey => {
	const inspection = something as AccountIdFromPublicKey
	return (
		inspection.accountIdString !== undefined &&
		inspection.accountIdString === 'AccountIdFromPublicKey' &&
		inspection.accountIdString !== undefined
	)
}

export const isAccountID = (something: unknown): something is AccountID => {
	if (isAccountIdFromBIP32Path(something)) return true
	if (isAccountIdFromPublicKey(something)) return true
	return false
}

export const accountIdFromBIP32Path = (hdPath: BIP32): AccountID => ({
	type: 'AccountIdFromBIP32Path',
	accountIdString: hdPath.toString(),
})

export const accountIdFromPublicKey = (publicKey: PublicKey): AccountID => ({
	type: 'AccountIdFromPublicKey',
	accountIdString: publicKey.toString(),
})

export const accountId = (id: AccountID | PublicKey | BIP32): AccountID => {
	if (isAccountID(id)) return id
	if (isPublicKey(id)) return accountIdFromPublicKey(id as PublicKey)
	return accountIdFromBIP32Path(id as BIP32)
}
