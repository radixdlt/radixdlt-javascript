import { decoder } from '@radixdlt/data-formats'
import { ok } from 'neverthrow'
import {
	AccountAddress,
	ValidatorAddress,
	ResourceIdentifier,
} from '@radixdlt/account'
import { Amount, NetworkId } from '@radixdlt/primitives'
import { isString } from '@radixdlt/util'
import { TransactionIdentifier } from '../dto'

export const amountDecoder = (...keys: string[]) =>
	decoder((value, key) =>
		key !== undefined && keys.includes(key) && isString(value)
			? Amount.fromUnsafe(value)
			: undefined,
	)

export const dateDecoder = (...keys: string[]) =>
	decoder((value, key) =>
		key !== undefined && keys.includes(key) && isString(value)
			? ok(new Date(value))
			: undefined,
	)

export const RRIDecoder = (...keys: string[]) =>
	decoder((value, key) =>
		key !== undefined && keys.includes(key) && isString(value)
			? ResourceIdentifier.fromUnsafe(value)
			: undefined,
	)

export const URLDecoder = (...keys: string[]) =>
	decoder((value, key) => {
		if (key !== undefined && keys.includes(key) && isString(value)) {
			try {
				return ok(new URL(value))
			} catch {
				return undefined
			}
		}
		return undefined
	})

export const transactionIdentifierDecoder = (...keys: string[]) =>
	decoder((value, key) =>
		key !== undefined && keys.includes(key) && isString(value)
			? TransactionIdentifier.create(value)
			: undefined,
	)

export const networkDecoder = (...keys: string[]) =>
	decoder((value, key) =>
		key !== undefined &&
		keys.includes(key) &&
		typeof value === 'number' &&
		Object.keys(NetworkId).includes(value.toString())
			? // @ts-ignore
			  ok(NetworkId[value.toString()])
			: undefined,
	)

export const addressDecoder = (...keys: string[]) =>
	decoder((value, key) =>
		key !== undefined && keys.includes(key) && isString(value)
			? AccountAddress.fromUnsafe(value)
			: undefined,
	)

export const validatorAddressDecoder = (...keys: string[]) =>
	decoder((value, key) =>
		key !== undefined && keys.includes(key) && isString(value)
			? ValidatorAddress.fromUnsafe(value)
			: undefined,
	)
