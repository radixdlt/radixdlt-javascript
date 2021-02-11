import { PublicKey } from '../../_types'
import { SecureRandom } from '@radixdlt/util'
import { ECIESEncryptProcedures, ECIESInput } from '../_types'

export type ECIESEncryptInput = ECIESInput<ECIESEncryptProcedures> &
	Readonly<{
		peerPublicKey: PublicKey
		M: Buffer // message to encrypt
		secureRandom?: SecureRandom
	}>
