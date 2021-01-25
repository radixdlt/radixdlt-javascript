import { Spin } from './_types'
import { isSomeEnum } from '@radixdlt/util'

export const isSpin = (something: unknown): something is Spin => {
	return isSomeEnum(Spin)(something)
}
