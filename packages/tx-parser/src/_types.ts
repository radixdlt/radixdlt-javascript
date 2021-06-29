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
	SYSCALL = 0x09,
	HEADER = 0x0a,
	DOWNINDEX = 0x0b,
	LREAD = 0x0c,
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
	UNCLAIMED_RE_ADDR = 0x00,
	ROUND_DATA = 0x01,
	EPOCH_DATA = 0x02,
	TOKEN_DEF = 0x03,
	TOKENS = 0x04,
	PREPARED_STAKE = 0x05,
	STAKE_OWNERSHIP = 0x06,
	PREPARED_UNSTAKE = 0x07,
	EXITING_STAKE = 0x08,
	VALIDATOR_META_DATA = 0x09,
	VALIDATOR_STAKE_DATA = 0x0a,
	VALIDATOR_BFT_DATA = 0x0b,
	VALIDATOR_ALLOW_DELEGATION_FLAG = 0x0c,
	VALIDATOR_REGISTRED_FLAG_COPY = 0x0d,
	VALIDATOR_REGISTRED_FLAG_UPDATE = 0x0e,
	VALIDATOR_RAKE_COPY = 0x0f,
	PREPARED_RAKE_UPDATE = 0x10,
	VALIDATOR_OWNER_COPY = 0x11,
	PREPARED_VALIDATOR_OWNER_UPDATE = 0x12,
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
export type Ins_VDOWN = BaseInstructionWithSubState<InstructionType.VDOWN>

export type Ins_VDOWNARG = BaseInstructionWithSubState<InstructionType.VDOWNARG> &
	Readonly<{
		argument: BytesT
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

export type Ins_DOWNALL = BaseInstruction<InstructionType.DOWNALL> &
	Readonly<{
		classId: Byte
	}>

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
	| Ins_SYSCALL
	| Ins_HEADER
	| Ins_VREAD

export type TransactionT = REPrimitive &
	Readonly<{
		instructions: InstructionT[]
		txID: () => string
	}>
