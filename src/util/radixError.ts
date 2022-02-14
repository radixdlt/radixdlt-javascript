type RadixAPIError = {
  message: string
  code?: number
  details?: {
    type: string
  } & Record<string, any>
  traceId?: string
}

enum ErrorType {
  API = 'API',
  HARDWARE_WALLET = 'HardwareWallet',
}

type ErrorParams = {
  [ErrorType.API]: RadixAPIError
  [ErrorType.HARDWARE_WALLET]: { message: string }
}

export const radixError =
  <T extends ErrorType>(type: T) =>
  <Params extends ErrorParams[T]>(params: Params) => ({
    ...Error(params.message),
    type,
    ...params,
  })

export const radixAPIError = radixError<ErrorType.API>(ErrorType.API)
type APIError = ReturnType<typeof radixAPIError>

export const hwWrapper = radixError<ErrorType.HARDWARE_WALLET>(
  ErrorType.HARDWARE_WALLET,
)
type HWError = ReturnType<typeof hwWrapper>

export type RadixError = APIError | HWError
