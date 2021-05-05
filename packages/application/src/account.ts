import {
	SigningKeyT,
	AccountAddressT,
	isSigningKey,
	isAccountAddress,
} from '@radixdlt/account'
import { AccountT } from './_types'

export const isAccount = (something: unknown): something is AccountT => {
	const inspection = something as AccountT
	return (
		inspection.signingKey !== undefined &&
		isSigningKey(inspection.signingKey) &&
		inspection.accountAddress !== undefined &&
		isAccountAddress(inspection.accountAddress)
	)
}

const create = (
	input: Readonly<{
		accountAddress: AccountAddressT
		signingKey: SigningKeyT
	}>,
): AccountT => {
	const { signingKey, accountAddress } = input
	if (!signingKey.publicKey.equals(accountAddress.publicKey)) {
		const errMsg = `Incorrect implementation, publicKey of accountAddress does not match publicKey of signingKey.`
		console.error(errMsg)
		throw new Error(errMsg)
	}
	const network = accountAddress.network
	const publicKey = signingKey.publicKey
	const hdPath = signingKey.hdPath
	return {
		...signingKey, // encrypt, decrypt, sign
		equals: (other: AccountT): boolean =>
			other.publicKey.equals(publicKey),
		signingKey: signingKey,
		accountAddress,
		network,
		publicKey,
		hdPath,
	}
}

export const Account = {
	create,
}
