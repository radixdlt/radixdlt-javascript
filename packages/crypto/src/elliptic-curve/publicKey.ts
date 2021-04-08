export {
	publicKeyFromPrivateKeyScalar,
	publicKeyFromPrivateKey,
} from './wrap/publicKeyWrapped'
import { publicKeyFromBytesValidated } from './wrap/publicKeyWrapped'
import { PublicKey } from '../_types'

export const publicKeyFromBytes = publicKeyFromBytesValidated

export const isPublicKey = (something: unknown): something is PublicKey => {
	const inspection = something as PublicKey

	return (
		inspection.asData !== undefined &&
		inspection.isValidSignature !== undefined &&
		inspection.decodeToPointOnCurve !== undefined &&
		inspection.equals !== undefined &&
		inspection.toString !== undefined
	)
}
