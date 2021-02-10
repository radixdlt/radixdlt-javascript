import { PublicKey } from '../../_types'
import { SecureRandom } from '@radixdlt/util'
import { ECIESEncryptProcedures, SharedInfo } from '../_types'

export type ECIESEncryptInput = Readonly<{
	peerPublicKey: PublicKey
	M: Buffer // message to encrypt
	procedures: ECIESEncryptProcedures
	sharedInfo?: SharedInfo
	secureRandom?: SecureRandom
}>
