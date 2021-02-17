import { CombineDataIntoCryptInput } from '../_types'
import { SharedInfo } from '../../ecies/_types'

export const simpleDataIntoCryptInputCombiner: CombineDataIntoCryptInput = (
	input: Readonly<{
		message: Buffer
		sharedInfo: SharedInfo
	}>,
): Buffer => input.message
