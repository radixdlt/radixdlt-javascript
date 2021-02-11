import { PrivateKey } from '../../_types'
import {
	ECIESDecryptProcedures,
	ECIESEncryptedMessage,
	ECIESInput,
} from '../_types'

export type ECIESDecryptInput = ECIESInput<ECIESDecryptProcedures> &
	Readonly<{
		privateKey: PrivateKey
		encryptedMessage: ECIESEncryptedMessage
	}>
