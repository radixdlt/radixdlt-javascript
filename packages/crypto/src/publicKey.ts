import { PublicKey } from './_types'
import { buffersEquals } from '@radixdlt/util'
export { publicKeyFromBytesValidated as publicKeyFromBytes } from './wrap/publicKeyWrapped'

// eslint-disable-next-line max-params
export const publicKeysEquals = (lhs: PublicKey, rhs: PublicKey): boolean => {
	const comparePubKeyBytes = (compressed: boolean): boolean => {
		const bytesFromKey = (pubKey: PublicKey): Buffer =>
			pubKey.asData({ compressed })
		return buffersEquals(bytesFromKey(lhs), bytesFromKey(rhs))
	}
	return comparePubKeyBytes(true) && comparePubKeyBytes(false)
}
