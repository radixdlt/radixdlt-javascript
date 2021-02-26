import { err, ok, Result } from 'neverthrow'
import { BIP32PathComponent } from './bip32PathComponent'
import { BIP32T, BIP32PathComponentT, Int32 } from './_types'

export const pathSeparator = '/'
export const hardener = `'`

export const unsafeCreate = (
	pathComponents: BIP32PathComponentT[],
): BIP32T => ({
	pathComponents,
	toString: (): string =>
		'm' +
		pathSeparator +
		pathComponents.map((pc) => pc.toString()).join(pathSeparator),
})

const create = (
	pathComponents: BIP32PathComponentT[],
): Result<BIP32T, Error> => {
	/* eslint-disable functional/no-loop-statement, functional/no-let */
	let lastLevel = pathComponents.length > 0 ? pathComponents[0].level - 1 : 0
	for (const pathComponent of pathComponents) {
		const level = pathComponent.level
		if (level !== lastLevel + 1)
			return err(
				new Error(
					'Expected components with strictly increasing level with an increment of one.',
				),
			)
		lastLevel = level
	}
	/* eslint-enable functional/no-loop-statement, functional/no-let */
	return ok(unsafeCreate(pathComponents))
}

const fromString = (path: string): Result<BIP32T, Error> => {
	let bip32Path = path.trim()
	if (bip32Path === '' || bip32Path === 'm' || bip32Path === pathSeparator) {
		return ok({
			pathComponents: [],
			toString: (): string => 'm',
		})
	}

	if (bip32Path.startsWith('M/') || bip32Path.startsWith('m/')) {
		bip32Path = bip32Path.slice(2)
		if (bip32Path.length === 0) {
			return err(new Error(`Must start with just 'm/' or 'M/'`))
		}
	}
	if (bip32Path.length === 0) {
		return err(new Error('Must not be empty'))
	}

	if (bip32Path.includes('//')) {
		return err(new Error(`Must not contain '//'`))
	}

	const components = bip32Path.split(pathSeparator)
	const pathComponents: BIP32PathComponentT[] = []
	for (const { index, value } of components.map((value, index) => ({
		index,
		value,
	}))) {
		const pathComponentResult = BIP32PathComponent.fromString(value, index)
		if (pathComponentResult.isErr()) return err(pathComponentResult.error)
		pathComponents.push(pathComponentResult.value)
	}
	return create(pathComponents)
}
const unsafeFromSimpleComponents = (
	pathComponents: Readonly<{
		index: Int32
		isHardened: boolean
	}>[],
): BIP32T =>
	unsafeCreate(
		pathComponents.map((e, i) =>
			BIP32PathComponent.create({
				...e,
				level: i,
			}),
		),
	)

export const BIP32 = {
	create,
	unsafeCreate,
	fromString,
	unsafeFromSimpleComponents,
}
