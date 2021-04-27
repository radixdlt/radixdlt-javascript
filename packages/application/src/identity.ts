import { AccountT, AccountAddressT } from '@radixdlt/account'
import { IdentityT } from './_types'

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
