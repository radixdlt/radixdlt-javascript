import { isPublicKey } from '@crypto'
import { SigningKeyT } from './_types'

export const isSigningKey = (something: unknown): something is SigningKeyT => {
  const inspection = something as SigningKeyT
  return (
    inspection.publicKey !== undefined &&
    isPublicKey(inspection.publicKey) &&
    inspection.sign !== undefined &&
    inspection.encrypt !== undefined &&
    inspection.decrypt !== undefined &&
    inspection.type !== undefined
  )
}
