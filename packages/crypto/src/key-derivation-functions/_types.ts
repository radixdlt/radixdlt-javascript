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

export type ScryptParamsT = Readonly<{
	// "N", CPU/memory cost parameter, must be power of 2.
	costParameterN: number
	costParameterC: number

	// "r", blocksize
	blockSize: number

	// "p"
	parallelizationParameter: number

	// "dklen"
	lengthOfDerivedKey: number

	salt: string
}>
