import { combine, err, Result } from 'neverthrow'
import { BIP32, hardener, pathSeparator } from '../bip32'
import { BIP32PathComponent, validateIndexValue } from '../bip32PathComponent'

import { BIP32PathComponentT, Int32 } from '../_types'
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
		toString: () => `m${pathSeparator}` + bip32.toString(),
	}
}

const fromString = (path: string): Result<BIP44T, Error> => {
	const paths = path.split(pathSeparator)
	if (paths.length !== 6)
		return err(new Error('Incorrect number of components in path'))
	if (!(paths[0] === 'M' || paths[0] === 'm'))
		return err(new Error(`Expeced first component to be either "m" or "M"`))
	if (paths[1] !== `44'`)
		return err(new Error(`Expected second component to be "44'"`))
	if (!paths[2].endsWith(hardener))
		return err(
			new Error(
				`Expected third component (coin type) to be hardened (end with ${hardener})`,
			),
		)
	if (!paths[3].endsWith(hardener))
		return err(
			new Error(
				`Expected fourth component (acocunt) to be hardened (end with ${hardener})`,
			),
		)
	if (!(paths[4] === '0' || paths[4] === '1'))
		return err(
			new Error(
				`Expeced fifth component to be either "0" or "1" (not be hardened)`,
			),
		)

	const coinType = parseInt(paths[2].split(hardener)[0])
	const account = parseInt(paths[3].split(hardener)[0])
	const change = parseInt(paths[4])

	const addressIndexParts = paths[5].split(hardener)
	const hardenAddress =
		addressIndexParts.length === 2 && addressIndexParts[1] === hardener
	const addressIndex = parseInt(addressIndexParts[0])

	return combine([
		validateIndexValue(coinType),
		validateIndexValue(account),
		validateIndexValue(addressIndex),
	]).map((resultList) =>
		create({
			coinType: resultList[0],
			account: resultList[1],
			change: change as BIP44ChangeIndex,
			address: {
				index: resultList[2],
				isHardened: hardenAddress,
			},
		}),
	)
}

export const BIP44 = {
	create,
	fromString,
}
