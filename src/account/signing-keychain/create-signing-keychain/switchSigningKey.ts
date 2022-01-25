import { SigningKeyT } from '../../signing-key/_types'
import {
  MutableSigningKeysT,
  SwitchSigningKeyInput,
  SwitchToIndex,
  SwitchToSigningKey,
} from '../_types'
import { isSigningKey } from '../../signing-key/isSigningKey'
import { log } from '@util'
import { BehaviorSubject, ReplaySubject } from 'rxjs'

export const isSwitchToIndex = (
  something: unknown,
): something is SwitchToIndex => {
  const inspection = something as SwitchToIndex
  return inspection.toIndex !== undefined
}

const isSwitchToSigningKey = (
  something: SwitchSigningKeyInput,
): something is SwitchToSigningKey => {
  const inspection = something as SwitchToSigningKey
  return (
    inspection.toSigningKey !== undefined &&
    isSigningKey(inspection.toSigningKey)
  )
}

export const switchSigningKey =
  (
    numberOfAllSigningKeys: () => number,
    signingKeysSubject: BehaviorSubject<MutableSigningKeysT>,
    setActiveSigningKey: (newSigningKey: SigningKeyT) => void,
  ) =>
  (input: SwitchSigningKeyInput): SigningKeyT => {
    const _switchSigningKey = switchSigningKey(
      numberOfAllSigningKeys,
      signingKeysSubject,
      setActiveSigningKey,
    )

    if (input === 'last') {
      const lastIndex = numberOfAllSigningKeys() - 1
      return _switchSigningKey({ toIndex: lastIndex })
    } else if (input === 'first') {
      return _switchSigningKey({ toIndex: 0 })
    } else if (isSwitchToSigningKey(input)) {
      const toSigningKey = input.toSigningKey
      setActiveSigningKey(toSigningKey)
      log.info(`Active signingKey switched to: ${toSigningKey.toString()}`)
      return toSigningKey
    } else if (isSwitchToIndex(input)) {
      const unsafeTargetIndex = input.toIndex
      const signingKeys = signingKeysSubject.getValue()

      const safeTargetIndex = Math.min(unsafeTargetIndex, signingKeys.size())

      const firstSigningKey = Array.from(signingKeys.all)[safeTargetIndex]
      if (!firstSigningKey) {
        const err = `No signingKeys.`
        log.error(err)
        throw new Error(err)
      }
      return _switchSigningKey({ toSigningKey: firstSigningKey })
    } else {
      const err = `Incorrect implementation, failed to type check 'input' of switchSigningKey. Probably is 'isSigningKey' typeguard wrong.`
      log.error(err)
      throw new Error(err)
    }
  }
