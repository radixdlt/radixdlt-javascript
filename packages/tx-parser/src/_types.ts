import { AmountT } from '@radixdlt/primitives'
import { PublicKeyT } from '@radixdlt/crypto'
import { UInt256 } from '@radixdlt/uint256'
import { Byte } from '@radixdlt/util'
import { err, ok, Result } from 'neverthrow'

export type BufferReaderT = Readonly<{
	finishedParsing: () => boolean
	readNextBuffer: (byteCount: number) => Result<Buffer, Error>
}>

const createBufferReader = (buf: Buffer): BufferReaderT => {
	if (!Buffer.isBuffer(buf)) throw new Error('A Buffer must be provided')
	let offset = 0
	let bytesLeftToRead = buf.length

	const readNextBuffer = (byteCount: number): Result<Buffer, Error> => {
		if (byteCount < 0)
			return err(new Error(`'byteCount' must be no negative`))
		if (byteCount === 0) {
			return ok(Buffer.alloc(0))
		}
		if (offset + byteCount > buf.length)
			return err(new Error(`Out of buffer's boundary`))
		const bufToReturn = Buffer.alloc(byteCount)
		buf.copy(bufToReturn, 0, offset, offset + byteCount)

		if (bufToReturn.length !== byteCount) {
			throw new Error(`Incorrect length of newly read buffer...`)
		}

		offset += byteCount
		bytesLeftToRead -= byteCount

		// console.log(`
		// 	🧵🧵🧵
		// 		read: #${byteCount} bytes,
		// 		read buffer: '0x${bufToReturn.toString('hex')}',
		// 		offset: ${offset},
		// 		source buffer: '0x${buf.toString('hex')}',
		// 		length of source buffer: #${buf.length} bytes.
		// 		bytesLeftToRead: #${bytesLeftToRead}
		// 	🧵🧵🧵
		// `)

		return ok(bufToReturn)
	}

	return {
		readNextBuffer,
		finishedParsing: (): boolean => {
			if (bytesLeftToRead < 0) {
				throw new Error(
					`Incorrect implementation, read too many bytes.`,
				)
			}
			return bytesLeftToRead === 0
		},
	}
}
export const BufferReader = {
	create: createBufferReader,
}

type REPrimitive = Readonly<{
	toBuffer: () => Buffer
	toString: () => string
}>

export enum InstructionType {
	END = 0,
	UP = 1,
	VDOWN = 2,
	VDOWNARG = 3,
	DOWN = 4,
	LDOWN = 5,
	MSG = 6,
	SIG = 7,
	DOWNALL = 8,
}

export const shouldInstructionBeParsedByLedger = (
	instructionType: InstructionType,
): boolean => {
	switch (instructionType) {
		case InstructionType.END:
		case InstructionType.UP:
		case InstructionType.MSG:
			return true
		default:
			return false
	}
}

export type BaseInstruction<IT extends InstructionType> = REPrimitive &
	Readonly<{
		instructionType: IT
	}>

export enum REAddressType {
	SYSTEM = 0x00,
	RADIX_NATIVE_TOKEN = 0x01,
	HASHED_KEY_NONCE = 0x03,
	PUBLIC_KEY = 0x04,
}

export type REAddressBase<AT extends REAddressType> = REPrimitive &
	Readonly<{
		reAddressType: AT
	}>

export type REAddressSystem = REAddressBase<REAddressType.SYSTEM>
export type REAddressNativeToken = REAddressBase<REAddressType.RADIX_NATIVE_TOKEN>
export type REAddressHashedKeyNonce = REAddressBase<REAddressType.HASHED_KEY_NONCE> &
	Readonly<{
		lower26Bytes: Buffer
	}>
export type REAddressPublicKey = REAddressBase<REAddressType.PUBLIC_KEY> &
	Readonly<{
		publicKey: PublicKeyT
	}>

export type REAddressT =
	| REAddressSystem
	| REAddressNativeToken
	| REAddressHashedKeyNonce
	| REAddressPublicKey

export enum SubStateType {
	RE_ADDRESS = 0x00,
	TOKEN_DEFINITION = 0x02,
	TOKENS = 0x03,
	PREPARED_STAKE = 0x04,
	VALIDATOR = 0x05,
	UNIQUE = 0x06,
	STAKE_SHARE = 0x0b,
	PREPARED_UNSTAKE = 0x0d,
	EXITING_STAKE = 0x0e,
}

export const shouldSubstateBeParsedByLedger = (
	substateType: SubStateType,
): boolean => {
	switch (substateType) {
		case SubStateType.TOKENS:
		case SubStateType.PREPARED_STAKE:
		case SubStateType.PREPARED_UNSTAKE:
			return true
		default:
			return false
	}
}

export type BaseSubstate<SST extends SubStateType> = REPrimitive &
	Readonly<{
		substateType: SST
	}>

export type TokensT = BaseSubstate<SubStateType.TOKENS> & {
	rri: REAddressT
	owner: REAddressT
	amount: AmountT
}

export type PreparedStakeT = BaseSubstate<SubStateType.PREPARED_STAKE> & {
	owner: REAddressT
	delegate: PublicKeyT
	amount: AmountT
}

export type PreparedUnstakeT = BaseSubstate<SubStateType.PREPARED_UNSTAKE> & {
	owner: REAddressT
	delegate: PublicKeyT
	amount: AmountT
}

export type Substate = TokensT | PreparedStakeT | PreparedUnstakeT

export type BaseInstructionWithSubState<
	IT extends InstructionType
> = BaseInstruction<IT> &
	Readonly<{
		substate: Substate
	}>

export type BytesT = REPrimitive &
	Readonly<{
		length: number
		data: Buffer
	}>

export type Ins_END = BaseInstruction<InstructionType.END>
export type Ins_UP = BaseInstructionWithSubState<InstructionType.UP>
export type Ins_MSG = BaseInstruction<InstructionType.MSG> &
	Readonly<{
		bytes: BytesT
	}>
export type Ins_VDOWN = BaseInstructionWithSubState<InstructionType.VDOWN>

export type Ins_VDOWNARG = BaseInstructionWithSubState<InstructionType.VDOWNARG> &
	Readonly<{
		argument: BytesT
	}>

export type UInt32 = number

export type SubstateId = REPrimitive &
	Readonly<{
		hash: Buffer
		index: UInt32
	}>

export type Ins_DOWN = BaseInstruction<InstructionType.DOWN> &
	Readonly<{
		substateId: SubstateId
	}>

export type Ins_LDOWN = BaseInstruction<InstructionType.LDOWN> &
	Readonly<{
		substateIndex: UInt32
	}>

export type TXSig = REPrimitive &
	Readonly<{
		v: Byte
		r: UInt256
		s: UInt256
	}>

export type Ins_SIG = BaseInstruction<InstructionType.SIG> &
	Readonly<{
		signature: TXSig
	}>

export type Ins_DOWNALL = BaseInstruction<InstructionType.DOWNALL> &
	Readonly<{
		classId: Byte
	}>

export type InstructionT =
	| Ins_END
	| Ins_UP
	| Ins_VDOWN
	| Ins_VDOWNARG
	| Ins_DOWN
	| Ins_LDOWN
	| Ins_MSG
	| Ins_SIG
	| Ins_DOWNALL

export type TransactionT = REPrimitive &
	Readonly<{
		instructions: InstructionT[]
	}>
