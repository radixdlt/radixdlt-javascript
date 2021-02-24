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
	unsafeFromSimpleComponents,
}
