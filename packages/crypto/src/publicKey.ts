export {
	publicKeyFromPrivateKeyScalar,
	publicKeyFromPrivateKey,
} from './wrap/publicKeyWrapped'
import { publicKeyFromBytesValidated } from './wrap/publicKeyWrapped'

export const publicKeyFromBytes = publicKeyFromBytesValidated
