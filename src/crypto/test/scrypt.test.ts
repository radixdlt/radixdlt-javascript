import { Scrypt, ScryptParams } from '..//key-derivation-functions/scrypt'
import { ScryptParamsT } from '..//key-derivation-functions/_types'

describe('scrypt', () => {
  it('returns underlying error', done => {
    const scryptParams: ScryptParamsT = ScryptParams.create({})
    const passwordString = 'my super secret password'
    const passwordBuffer = Buffer.from(passwordString)

    Scrypt.deriveKey({
      password: passwordBuffer,
      kdf: 'scrypt',
      params: {
        ...scryptParams,
        costParameterN: 3, // not a multiple of 2, will cause error
      },
    }).match(
      k => done(new Error('Expected error but got none.')),
      e => {
        const expectedError = `Failed to derive data using scrypt, underlying error: 'N must be power of 2'`
        expect(e.message).toBe(expectedError)
        done()
      },
    )
  })
})
