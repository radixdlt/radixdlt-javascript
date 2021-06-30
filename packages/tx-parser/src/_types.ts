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
	DOWN = 0x04,
	LDOWN = 0x05,
	MSG = 0x06,
	SIG = 0x07, // Only used for tests...
	SYSCALL = 0x09,
	HEADER = 0x0a,
	VREAD = 0x0d,
	READ = 0x0e,
}
export type BaseInstruction<IT extends InstructionType> = REPrimitive &
	Readonly<{
		toHumanReadableString?: () => string
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
	TOKENS = 0x05,
	PREPARED_STAKE = 0x06,
	STAKE_OWNERSHIP = 0x07,
	PREPARED_UNSTAKE = 0x08,
	VALIDATOR_ALLOW_DELEGATION_FLAG = 0x0d,
	VALIDATOR_OWNER_COPY = 0x12,
}

export type BaseSubstate<SST extends SubStateType> = REPrimitive &
	Readonly<{
		substateType: SST
		toHumanReadableString?: () => string
	}>

export type TokensT = BaseSubstate<SubStateType.TOKENS> & {
	// Reserved, always 0
	reserved: Byte
	owner: REAddressT
	// RRI
	resource: REAddressT
	amount: AmountT
}

export type BaseValidatorSubstate<
	SST extends SubStateType
> = BaseSubstate<SST> &
	Readonly<{
		// Reserved, always 0
		reserved: Byte
		// The validator public key
		validator: PublicKeyT
	}>

export type BaseStakingSubstate<
	SST extends SubStateType
> = BaseValidatorSubstate<SST> &
	Readonly<{
		// The stake owner
		owner: REAddressT
		amount: AmountT
	}>

export type PreparedStakeT = BaseStakingSubstate<SubStateType.PREPARED_STAKE>
export type PreparedUnstakeT = BaseStakingSubstate<SubStateType.PREPARED_UNSTAKE>
export type StakeOwnershipT = BaseStakingSubstate<SubStateType.STAKE_OWNERSHIP>

export type ValidatorAllowDelegationFlagT = BaseValidatorSubstate<SubStateType.VALIDATOR_ALLOW_DELEGATION_FLAG> &
	Readonly<{
		isDelegationAllowed: boolean
	}>

export type ValidatorOwnerCopyT = BaseValidatorSubstate<SubStateType.VALIDATOR_OWNER_COPY> &
	Readonly<{
		owner: REAddressT
	}>

export type SubstateT =
	| TokensT
	| PreparedStakeT
	| PreparedUnstakeT
	| StakeOwnershipT
	| ValidatorAllowDelegationFlagT
	| ValidatorOwnerCopyT

export const stringifySubstateType = (substateType: SubStateType): string => {
	switch (substateType) {
		case SubStateType.TOKENS:
			return 'Tokens'
		case SubStateType.VALIDATOR_OWNER_COPY:
			return 'ValidatorOwnerCopy'
		case SubStateType.PREPARED_STAKE:
			return 'PreparedStake'
		case SubStateType.PREPARED_UNSTAKE:
			return 'PreparedUnstake'
		case SubStateType.STAKE_OWNERSHIP:
			return 'StakeOwnership'
		case SubStateType.VALIDATOR_ALLOW_DELEGATION_FLAG:
			return 'ValidatorAllowDelegationFlag'
		default:
			return `Unsupported-${SubStateType[substateType]}`
	}
}

export type BaseInstructionWithSubState<
	IT extends InstructionType
> = BaseInstruction<IT> &
	Readonly<{
		substate: SubstateT
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

export type UInt32 = number

export type SubstateIdT = REPrimitive &
	Readonly<{
		hash: Buffer
		index: UInt32
	}>

export type Ins_DOWN = BaseInstruction<InstructionType.DOWN> &
	Readonly<{
		substateId: SubstateIdT
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

export const SYSCALL_TX_FEE_RESERVE_PUT = 0x00
export const SYSCALL_TX_FEE_RESERVE_TAKE = 0x01

// When SYSCALL is used for TX FEE then callData SHOULD have length 33 bytes, where first byte
// is either `SYSCALL_TX_FEE_RESERVE_PUT` (0x01) or `SYSCALL_TX_FEE_RESERVE_TAKE` (0x01) followed
// by 32 Bytes representing UInt256 (tx fee amount).
export type Ins_SYSCALL = BaseInstruction<InstructionType.SYSCALL> &
	Readonly<{
		callData: BytesT
	}>
export type Ins_HEADER = BaseInstruction<InstructionType.HEADER> &
	Readonly<{
		version: Byte
		flag: Byte
	}>

export type Ins_VREAD = BaseInstructionWithSubState<InstructionType.VREAD>

export type Ins_READ = BaseInstruction<InstructionType.READ> &
	Readonly<{
		substateId: SubstateIdT
	}>

export type InstructionT =
	| Ins_END
	| Ins_UP
	| Ins_DOWN
	| Ins_LDOWN
	| Ins_MSG
	| Ins_SIG
	| Ins_SYSCALL
	| Ins_HEADER
	| Ins_VREAD
	| Ins_READ

export type TransactionT = REPrimitive &
	Readonly<{
		instructions: InstructionT[]
		txID: () => string
	}>
