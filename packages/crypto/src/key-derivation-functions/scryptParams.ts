import { SecureRandom, secureRandomGenerator } from '@radixdlt/util'
import { ScryptParamsT } from './_types'

const create = (input: Readonly<{ 
	secureRandom?: SecureRandom
 }>): ScryptParamsT => {

	const secureRandom = input.secureRandom ?? secureRandomGenerator
    const salt = secureRandom.randomSecureBytes(32)

	return {
	    costParameterN: 8192,
	    costParameterC: 262144,
	    blockSize: 8,
	    parallelizationParameter: 1,
	    lengthOfDerivedKey: 32,
	    salt: salt,
    }
}

export const ScryptParams = {
    create
}