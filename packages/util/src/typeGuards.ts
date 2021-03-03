import { Result } from "neverthrow"

const isT = <T>(validate: (value: unknown) => boolean) => (value: unknown): value is T => validate(value)

export const isString = isT<string>(value => typeof value === 'string')

export const isObject = isT<Record<string, unknown>>(value => typeof value === 'object' && !Array.isArray(value) && !isResult(value))

export const isArray = isT<Array<unknown>>(value => Array.isArray(value))

export const isBoolean = isT<boolean>(value => typeof value === 'boolean')

export const isNumber = isT<number>(value => typeof value === 'number')

export const isResult = isT<Result<unknown, Error>>(value => (value as any)._unsafeUnwrap ? true : false)