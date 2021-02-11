import { ECPointOnCurve } from '../_types'
import { sha512Twice } from '../algorithms'
import { SharedInfo } from '../ecies/_types'
import { KeyDerivationScheme } from './_types'

export const unsafeKDF: KeyDerivationScheme = {
	length: 64,
	combineDataForKDFInput: (
		input: Readonly<{
			sharedSecretPoint: ECPointOnCurve
			sharedInfo: SharedInfo
		}>,
	): Buffer => Buffer.from(input.sharedSecretPoint.x.toString(16), 'hex'),
	keyDerivationFunction: sha512Twice,
}
