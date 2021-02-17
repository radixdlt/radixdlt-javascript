import { ECIESInput, ECIESProcedures, SharedInfo } from './_types'

export const sharedInputOrEmpty = <P extends ECIESProcedures>(
	eciesInput: ECIESInput<P>,
): SharedInfo => {
	const sharedInfo1 = eciesInput.sharedInfo?.s1 ?? Buffer.alloc(0)
	const sharedInfo2 = eciesInput.sharedInfo?.s2 ?? Buffer.alloc(0)
	return { s1: sharedInfo1, s2: sharedInfo2 }
}
