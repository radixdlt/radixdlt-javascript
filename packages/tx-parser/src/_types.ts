/*
pub enum Instruction {
    UP(Box<dyn Substate>),
    VDOWN(Box<dyn Substate>),
    VDOWNARG(Box<dyn Substate>, Bytes),
    DOWN(SubstateId),
    LDOWN(u32),
    DOWNALL(u8),
    MSG(Bytes),
    SIG(Signature),
    END,
}
* */

import { AmountT } from '@radixdlt/primitives'
import { AccountAddressT, ResourceIdentifierT } from '@radixdlt/account'
import { PublicKeyT } from '@radixdlt/crypto'

export enum InstructionType {
	END = 0x00,
	UP = 0x01,
	MSG = 0x06,
}
export enum InstructionTypeUnsupported {
	VDOWN = 0x02,
	VDOWNARG = 0x03,
	DOWN = 0x04,
	LDOWN = 0x05,
	SIG = 0x07,
	DOWNALL = 0x08,
}

export type BaseInstruction<IT extends InstructionType> = Readonly<{
	instructionType: IT
}>

export enum SubStateType {
	TOKENS = 0x03,
	PREPARED_STAKE = 0x04,
	PREPARED_UNSTAKE = 0x0d,
}

export type BaseSubstate<SST extends SubStateType> = Readonly<{
	substateType: SST
}>

export type Tokens = BaseSubstate<SubStateType.TOKENS> & {
	rri: ResourceIdentifierT
	owner: AccountAddressT
	amount: AmountT
}

export type PreparedStake = BaseSubstate<SubStateType.PREPARED_STAKE> & {
	owner: AccountAddressT
	delegate: PublicKeyT
	amount: AmountT
}

export type PreparedUnstake = BaseSubstate<SubStateType.PREPARED_UNSTAKE> & {
	owner: AccountAddressT
	delegate: PublicKeyT
	amount: AmountT
}

export type Substate = Tokens | PreparedStake | PreparedUnstake

export enum SubStateTypeUnsupported {
	RE_ADDRESS = 0x00,
	TOKEN_DEFINITION = 0x02,
	VALIDATOR = 0x05,
	UNIQUE = 0x06,
	STAKE_SHARE = 0x0b,
	EXITING_STAKE = 0x0e,
}

export type BaseInstructionWithSubState<
	IT extends InstructionType
> = BaseInstruction<IT> &
	Readonly<{
		substate: Substate
	}>

export type Ins_END = BaseInstruction<InstructionType.END>
export type Ins_UP = BaseInstructionWithSubState<InstructionType.UP>
export type Ins_MSG = BaseInstruction<InstructionType.MSG> &
	Readonly<{
		msg: Buffer
	}>

export type Instruction = Ins_END | Ins_UP | Ins_MSG

export type Transaction = Readonly<{
	instructions: Instruction[]
}>
