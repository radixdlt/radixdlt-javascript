import { Int64 } from '@radixdlt/primitives'
import Long = require('long')
import { combine, err, ok, Result } from 'neverthrow'
import { BIP32, hardener, pathSeparator } from '../bip32'
import { BIP32PathComponent, validateIndexValue } from '../bip32PathComponent'

import { BIP32PathComponentT, BIP32T, Int32 } from '../_types'
import { BIP44T, BIP44ChangeIndex } from './_types'

export const RADIX_COIN_TYPE = 536

const bip44Component = (
	input: Readonly<{
		index: Int32
		isHardened: boolean
		level: number
		name: string
	}>,
): BIP32PathComponentT => {
	return {
		...BIP32PathComponent.create(input),
		name: input.name,
	}
}

const bip44Purpose = bip44Component({
	index: 44,
	isHardened: true,
	level: 1,
	name: 'purpose',
})

const bip44CoinType = (index: Int32): BIP32PathComponentT =>
	bip44Component({
		index: index,
		isHardened: true,
		level: 2,
		name: 'coin type',
	})

const bip44Account = (index: Int32): BIP32PathComponentT =>
	bip44Component({
		index: index,
		isHardened: true,
		level: 3,
		name: 'account',
	})

const bip44Change = (index: BIP44ChangeIndex): BIP32PathComponentT =>
	bip44Component({
		index: index as Int32,
		isHardened: false,
		level: 4,
		name: 'change',
	})

const create = (
	input: Readonly<{
		coinType?: Int32 // defauts to `536'` (Radix)
		account?: Int32 // defaults to `0'`
		change?: BIP44ChangeIndex // defaults to `0`
		address: Readonly<{
			index: Int32
			isHardened?: boolean // defaults to true
		}>
	}>,
): BIP44T => {
	const purpose = bip44Purpose
	const coinType = bip44CoinType(input.coinType ?? RADIX_COIN_TYPE)
	const account = bip44Account(input.account ?? 0)
	const change = bip44Change(input.change ?? 0)
	const addressIndex = bip44Component({
		index: input.address.index,
		isHardened: input.address.isHardened ?? true,
		level: 5,
		name: 'address index',
	})
	const pathComponents = [purpose, coinType, account, change, addressIndex]

	const bip32 = BIP32.unsafeCreate(pathComponents)
	return {
		...bip32,
		purpose,
		coinType,
		account,
		change,
		addressIndex,
		pathComponents,
	}
}

const validateBIP44Component = (
	expected: Readonly<{
		index?: Int64
		isHardened: boolean
		level: number
		name?: string
	}>,
	component: BIP32PathComponentT,
): Result<BIP32PathComponentT, Error> => {
	if (component.level !== expected.level)
		return err(new Error('Wrong level in BIP44 path'))
	if (component.isHardened !== expected.isHardened)
		return err(new Error('Wrong hardened value'))
	if (expected.name) {
		if (component.name !== expected.name)
			return err(new Error('Wrong name'))
	}
	if (expected.index) {
		if (Long.fromValue(component.index).neq(expected.index)) {
			return err(new Error('Wrong index'))
		}
	}
	return ok(component)
}

const validateBIP44Purpose = validateBIP44Component.bind(null, bip44Purpose)
const validateBIP44CoinType = validateBIP44Component.bind(null, {
	...bip44CoinType(0),
	index: undefined,
})
const validateBIP44Account = validateBIP44Component.bind(null, {
	...bip44Account(0),
	index: undefined,
})
const validateBIP44Change = validateBIP44Component.bind(null, {
	...bip44Change(0),
	index: undefined,
})

const fromString = (path: string): Result<BIP44T, Error> => {
	return BIP32.fromString(path).andThen(
		(bip32: BIP32T): Result<BIP44T, Error> => {
			const components = bip32.pathComponents
			if (components.length !== 5)
				return err(
					new Error(
						`We require BIP44 to have five components: purpose / cointype / account / change / address`,
					),
				)

			return combine([
				validateBIP44Purpose({ ...components[0], name: 'purpose' }),
				validateBIP44CoinType({ ...components[1], name: 'coin type' }),
				validateBIP44Account({ ...components[2], name: 'account' }),
				validateBIP44Change({ ...components[3], name: 'change' }),
				ok({ ...components[4], name: 'address index' }) as Result<
					BIP32PathComponentT,
					Error
				>,
			]).map(
				(bip44Components: BIP32PathComponentT[]): BIP44T => ({
					...bip32,
					purpose: bip44Components[0],
					coinType: bip44Components[1],
					account: bip44Components[2],
					change: bip44Components[3],
					addressIndex: bip44Components[4],
					pathComponents: bip44Components,
				}),
			)
		},
	)
}

export const BIP44 = {
	create,
	fromString,
}
