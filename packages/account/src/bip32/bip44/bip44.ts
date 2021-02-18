import { combine, Err, err, ok, Result, ResultAsync } from 'neverthrow'
import { bip32Component, validateIndexValue } from '../bip32'
import { BIP32PathComponent, Int32 } from '../_types'
import { BIP44, BIP44ChangeIndex } from './_types'

export const bip44Component = (
	input: Readonly<{
		index: Int32
		isHardened: boolean
		level: number
		name: string
	}>,
): BIP32PathComponent => {

	return {
		...bip32Component(input),
		name: input.name
	}
}

export const bip44Purpose = bip44Component({
	index: 44,
	isHardened: true,
	level: 1,
	name: 'purpose',
})

export const bip44CoinType = (index: Int32): BIP32PathComponent =>
	bip44Component({
		index: index,
		isHardened: true,
		level: 2,
		name: 'coin type',
	})

export const bip44Account = (index: Int32): BIP32PathComponent =>
	bip44Component({
		index: index,
		isHardened: true,
		level: 3,
		name: 'account',
	})

export const bip44Change = (index: BIP44ChangeIndex): BIP32PathComponent =>
	bip44Component({
		index: index as Int32,
		isHardened: false,
		level: 4,
		name: 'change',
	})

const validateBIP44CoinType = (
	coinType: BIP32PathComponent,
): Result<BIP32PathComponent, Error> => {
	if (!coinType.isHardened)
		return err(new Error('Coin type should be hardened'))
	if (coinType.level !== 2)
		return err(new Error('Path level of coin type should be 2'))
	if (coinType.name !== 'coin type')
		return err(new Error(`Name of path component should be 'coin type'`))
	return ok(coinType)
}

export const makeBIP44 = (
	input: Readonly<{
		coinType: Int32
		account: Int32
		change: BIP44ChangeIndex
		addressIndexPath: Readonly<{ index: Int32; hardened: boolean }>
	}>,
): BIP44 => {
	const purpose = bip44Purpose
	const coinType = bip44CoinType(input.coinType)
	const account = bip44Account(input.account)
	const change = bip44Change(input.change)
	const addressIndex = bip44Component({
		index: input.addressIndexPath.index,
		isHardened: input.addressIndexPath.hardened,
		level: 5,
		name: 'address index',
	})
	const pathComponents = [purpose, coinType, account, change, addressIndex]
	return {
		purpose,
		coinType,
		account,
		change,
		addressIndex,
		pathComponents,
		toString: () =>
			['m', ...pathComponents.map((pc) => pc.toString())].join(
				pathSeparator,
			),
	}
}
const pathSeparator = '/'
const hardener = `'`

export const bip44FromString = (path: string): Result<BIP44, Error> => {
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
		makeBIP44({
			coinType: resultList[0],
			account: resultList[1],
			change: change as BIP44ChangeIndex,
			addressIndexPath: { index: resultList[2], hardened: hardenAddress },
		}),
	)
}
