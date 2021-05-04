import {
	AccountT,
	AccountAddressT,
	isAccount,
	isAccountAddress,
} from '@radixdlt/account'
import { IdentityT } from './_types'

export const isIdentity = (something: unknown): something is IdentityT => {
	const inspection = something as IdentityT
	return (
		inspection.account !== undefined &&
		isAccount(inspection.account) &&
		inspection.accountAddress !== undefined &&
		isAccountAddress(inspection.accountAddress)
	)
}

const create = (
	input: Readonly<{
		accountAddress: AccountAddressT
		account: AccountT
	}>,
): IdentityT => {
	const { account, accountAddress } = input
	if (!account.publicKey.equals(accountAddress.publicKey)) {
		const errMsg = `Incorrect implementation, publicKey of accountAddress does not match publicKey of account.`
		console.error(errMsg)
		throw new Error(errMsg)
	}
	const network = accountAddress.network
	const publicKey = account.publicKey
	const hdPath = account.hdPath
	return {
		...account, // encrypt, decrypt, sign
		equals: (other: IdentityT): boolean =>
			other.publicKey.equals(publicKey),
		account: account,
		accountAddress,
		network,
		publicKey,
		hdPath,
	}
}

export const Identity = {
	create,
}
