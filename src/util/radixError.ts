type RadixErrorInput = {
  message: string
  code?: number
  details?: {
    type: string
  } & any
  traceId?: string
}

export const radixError = (error: RadixErrorInput) => error

export type RadixError = ReturnType<typeof radixError>
