import { AmountT } from '@radixdlt/primitives'
import { PublicKeyT } from '@radixdlt/crypto'
import { UInt256 } from '@radixdlt/uint256'
import { Byte } from '@radixdlt/util'

type REPrimitive = Readonly<{
	toBuffer: () => Buffer
	toString: () => string
}>

export enum InstructionType {
	END = 0x00,
	UP = 0x01,
	VDOWN = 0x02,
	VDOWNARG = 0x03,
	DOWN = 0x04,
	LDOWN = 0x05,
	MSG = 0x06,
	SIG = 0x07,
	DOWNALL = 0x08,
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
