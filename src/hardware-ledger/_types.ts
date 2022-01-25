import { Observable } from 'rxjs'

export enum Instruction {
  GET_VERSION = 0x03,
  GET_APP_NAME = 0x04,
  GET_PUBLIC_KEY = 0x05,
  DO_SIGN_TX = 0x06,
  DO_SIGN_HASH = 0x07,
  DO_KEY_EXCHANGE = 0x08,
}

export const RESPONSE_LENGTH_BYTES = 2

/// Keep in sync with: https://github.com/radixdlt/app-radix/blob/main/src/sw.h
export enum StatusCode {
  ERR_CMD_SIGN_TX_UNSUPPORTED_INSTRUCTION_TYPE = 0xc608,
  ERR_COMMON_BAD_STATE = 0xe001,
  ERR_ASSERTION_FAILED = 0xe002,
  ERR_FATAL_ERROR = 0xe003,
  SW_DENY = 0x6985,
  SW_WRONG_P1P2 = 0x6a86,
  SW_WRONG_DATA_LENGTH = 0x6a87,
  SW_INS_NOT_SUPPORTED = 0x6d00,
  SW_CLA_NOT_SUPPORTED = 0x6e00,
  SW_OK = 0x9000,
}

export const prettifyLedgerResponseCode = (code: StatusCode): string =>
  `${code === StatusCode.SW_OK ? '✅' : '❌'} code: '${StatusCode[code]
  }' 0x${code.toString(16)} (0d${code.toString(10)})`

export type CreateLedgerNanoTransportInput = Readonly<{
  openTimeout?: number
  listenTimeout?: number
}>

export const RadixCLA = 0xaa

export type APDU = {
  cla: number
  ins: number
  p1: number
  p2: number
  data?: Buffer
  statusCodes: StatusCode[]
}

export type PartialAPDUT = Omit<
  APDU,
  'p1' | 'p2' | 'requiredResponseStatusCodeFromDevice'
> &
  Readonly<{
    p1?: number
    p2?: number
    statusCodes?: StatusCode[]
  }>

export type RadixAPDUT = APDU & {
  cla: typeof RadixCLA
  ins: Instruction
}

export type LedgerNanoT = Readonly<{
  sendAPDUToDevice: (apdu: RadixAPDUT) => Observable<Buffer>
}>

export type Device = {
  send: (
    cla: number,
    ins: number,
    p1: number,
    p2: number,
    data?: Buffer,
    statusList?: ReadonlyArray<number>,
  ) => Promise<Buffer>
  device: {
    getDeviceInfo: () => void
  }
}

export type ConnectionEvent = {
  type: 'add' | 'remove'
  descriptor: string
  deviceModel: string
  device: any
}
