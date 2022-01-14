import { Observable } from 'rxjs'

export enum LedgerInstruction {
  GET_VERSION = 0x03,
  GET_APP_NAME = 0x04,
  GET_PUBLIC_KEY = 0x05,
  DO_SIGN_TX = 0x06,
  DO_SIGN_HASH = 0x07,
  DO_KEY_EXCHANGE = 0x08,
}

/// Keep in sync with: https://github.com/radixdlt/app-radix/blob/main/src/sw.h
export enum LedgerResponseCodes {
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

export const prettifyLedgerResponseCode = (code: LedgerResponseCodes): string =>
  `${code === LedgerResponseCodes.SW_OK ? '✅' : '❌'} code: '${
    LedgerResponseCodes[code]
  }' 0x${code.toString(16)} (0d${code.toString(10)})`

export type CreateLedgerNanoTransportInput = Readonly<{
  openTimeout?: number
  listenTimeout?: number
}>

export const radixCLA: number = 0xaa

export type APDUT = Readonly<{
  // (type: 'number') Always to '0xAA'
  cla: number
  ins: number

  //  Will default to `0` if undefined
  p1: number

  // Should not be present if `p1` is 'undefined'. Will default to `0` if undefined
  p2: number

  // defaults to zero length buffer
  data?: Buffer

  // defaults to: `[SW_OK]`
  requiredResponseStatusCodeFromDevice: LedgerResponseCodes[]
}>

export type PartialAPDUT = Omit<
  APDUT,
  'p1' | 'p2' | 'requiredResponseStatusCodeFromDevice'
> &
  Readonly<{
    p1?: number

    // Should not be present if `p1` is 'undefined'. Will default to `0` if undefined
    p2?: number

    // defaults to: `[SW_OK]`
    requiredResponseStatusCodeFromDevice?: LedgerResponseCodes[]
  }>

export type RadixAPDUT = APDUT &
  Readonly<{
    cla: typeof radixCLA
    ins: LedgerInstruction
  }>

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
