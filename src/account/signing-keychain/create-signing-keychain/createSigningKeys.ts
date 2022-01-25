import { HDPathRadixT, PublicKeyT } from '@crypto'
import { SigningKeysT, SigningKeyT } from '../../signing-key/_types'
import { MutableSigningKeysT } from '../_types'
import { Option } from 'prelude-ts'
import { arraysEqual } from '@util'

const stringifySigningKeysArray = (signingKeys: SigningKeyT[]): string =>
  signingKeys.map(a => a.toString()).join(',\n')

const stringifySigningKeys = (signingKeys: SigningKeysT): string => {
  const allSigningKeysString = stringifySigningKeysArray(signingKeys.all)

  return `
		size: ${signingKeys.size()},
		#hdSigningKeys: ${signingKeys.hdSigningKeys().length},
		#nonHDSigningKeys: ${signingKeys.nonHDSigningKeys().length},
		#localHDSigningKeys: ${signingKeys.localHDSigningKeys().length},
		#hardwareHDSigningKeys: ${signingKeys.hardwareHDSigningKeys().length},
		
		all: ${allSigningKeysString}
	`
}

export const createSigningKeys = (): MutableSigningKeysT => {
  const all: SigningKeyT[] = []

  const getHDSigningKeyByHDPath = (
    hdPath: HDPathRadixT,
  ): Option<SigningKeyT> => {
    const signingKey = all
      .filter(a => a.isHDSigningKey)
      .find(a => a.hdPath!.equals(hdPath))
    return Option.of(signingKey)
  }

  const getAnySigningKeyByPublicKey = (
    publicKey: PublicKeyT,
  ): Option<SigningKeyT> => {
    const signingKey = all.find(a => a.publicKey.equals(publicKey))
    return Option.of(signingKey)
  }

  const localHDSigningKeys = () => all.filter(a => a.isLocalHDSigningKey)

  const hardwareHDSigningKeys = () => all.filter(a => a.isHardwareSigningKey)

  const nonHDSigningKeys = () => all.filter(a => !a.isHDSigningKey)

  const hdSigningKeys = () => all.filter(a => a.isHDSigningKey)

  const add = (signingKey: SigningKeyT): void => {
    if (
      all.find(a => a.type.uniqueKey === signingKey.type.uniqueKey) !==
      undefined
    ) {
      // already there
      return
    }
    // new
    all.push(signingKey)
  }

  const signingKeys: MutableSigningKeysT = {
    toString: (): string => {
      throw new Error('Overriden below')
    },
    equals: (other: SigningKeysT): boolean => arraysEqual(other.all, all),
    add,
    localHDSigningKeys,
    hardwareHDSigningKeys,
    nonHDSigningKeys,
    hdSigningKeys,
    all,
    size: () => all.length,
    getHDSigningKeyByHDPath,
    getAnySigningKeyByPublicKey,
  }

  return {
    ...signingKeys,
    toString: (): string => stringifySigningKeys(signingKeys),
  }
}
