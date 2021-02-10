import { PrivateKey } from '../../_types'
import {
	ECIESDecryptProcedures,
	ECIESEncryptedMessage,
	SharedInfo,
} from '../_types'

export type ECIESDecryptInput = Readonly<{
	privateKey: PrivateKey
	encryptedMessage: ECIESEncryptedMessage
	procedures: ECIESDecryptProcedures
	sharedInfo?: SharedInfo
}>
