import { ECPointOnCurve } from '../_types'
import { SharedInfo } from '../ecies/_types'

export type KeyDerivationScheme = Readonly<{
	length: number
	/// Build input
	combineDataForKDFInput: (
		input: Readonly<{
			sharedSecretPoint: ECPointOnCurve
			sharedInfo: SharedInfo
		}>,
	) => Buffer
	keyDerivationFunction: (input: Buffer) => Buffer
}>
