import {
  BuiltTransaction,
  TransactionIntent,
  TransactionTrackingEventType,
} from '../dto'
import { TrackError } from './_types'
import { combine, combineWithAllErrors, err, ok, Result } from 'neverthrow'
import {
  InstructionT,
  InstructionType,
  Ins_END,
  Ins_UP,
  REAddressT,
  REAddressType,
  SubStateType,
  Transaction,
} from '@tx-parser'
import { log, radixAPIError } from '@util'
import { AccountAddress, AccountAddressT, AmountT, Network } from '@application'
import {
  ResourceIdentifierT,
  ValidatorAddress,
  ValidatorAddressT,
} from '@account'
import {
  ActionType,
  IntendedStakeTokensAction,
  IntendedTransferTokensAction,
  IntendedUnstakeTokensAction,
} from '../actions'

type Instruction<T extends SubStateType> = {
  substateType: T
  amount: AmountT
  owner: AccountAddressT
  validator: ValidatorAddressT
}

type Tokens = Omit<Instruction<SubStateType.TOKENS>, 'validator'> & {
  resource: string
}

type PreparedStake = Instruction<SubStateType.PREPARED_STAKE>

type PreparedUnstake = Instruction<SubStateType.PREPARED_UNSTAKE>

type StakeOwnership = Instruction<SubStateType.STAKE_OWNERSHIP>

type TokensGroup = [Tokens, Tokens]

type PreparedStakeGroup = [Tokens, PreparedStake]

type PreparedUnstakeGroup = [PreparedUnstake, StakeOwnership]

type InstructionGroup = TokensGroup | PreparedStakeGroup | PreparedUnstakeGroup

const accountAddressFromREAddressAndNetwork = ({
  reAddress,
  network,
}: {
  reAddress: REAddressT
  network: Network
}): Result<AccountAddressT, null> => {
  return reAddress.reAddressType === REAddressType.PUBLIC_KEY
    ? ok(
        AccountAddress.fromPublicKeyAndNetwork({
          publicKey: reAddress.publicKey,
          network,
        }),
      )
    : err(null)
}

const filterInstructions = <RT extends InstructionT>(
  types: InstructionType[],
) => (instructions: InstructionT[]) =>
  instructions.filter((instruction): instruction is RT =>
    types.includes(instruction.instructionType),
  )

const filterUpAndEndInstructions = filterInstructions<Ins_UP | Ins_END>([
  InstructionType.END,
  InstructionType.UP,
])

const groupInstructionsByActions = (instructions: (Ins_UP | Ins_END)[]) =>
  instructions
    .reduce<Ins_UP[][]>(
      (acc, curr) => {
        if (curr.instructionType === InstructionType.END) {
          return [[], ...acc]
        }
        acc[0].push(curr)
        return acc
      },
      [[]],
    )
    .reverse()
    .slice(0, -1)

const parseGroupData = (network: Network) => (groups: Ins_UP[][]) =>
  groups.map(group =>
    combine(
      group.map(({ substate }) => {
        switch (substate.substateType) {
          case SubStateType.TOKENS: {
            return accountAddressFromREAddressAndNetwork({
              reAddress: substate.owner,
              network,
            }).map(
              (owner): Tokens => ({
                amount: substate.amount,
                owner,
                resource: substate.resource.toBuffer().toString('hex'),
                substateType: substate.substateType,
              }),
            )
          }
          case SubStateType.PREPARED_STAKE:
          case SubStateType.PREPARED_UNSTAKE:
          case SubStateType.STAKE_OWNERSHIP: {
            return accountAddressFromREAddressAndNetwork({
              reAddress: substate.owner,
              network,
            }).map((owner):
              | PreparedStake
              | PreparedUnstake
              | StakeOwnership => ({
              amount: substate.amount,
              owner,
              validator: ValidatorAddress.fromPublicKeyAndNetwork({
                publicKey: substate.validator,
                network,
              }),
              substateType: substate.substateType,
            }))
          }

          default:
            return ok(null)
        }
      }),
    ),
  )

const assert = (
  condition: boolean,
  errorMessage: string,
): Result<null, Error> => (condition ? ok(null) : err(Error(errorMessage)))

const assertSubstateTypes = (
  expectedSubStateTypes: SubStateType[],
  subStateTypes: SubStateType[],
) =>
  assert(
    subStateTypes.every(substateType =>
      expectedSubStateTypes.includes(substateType),
    ),
    `incorrect subStateTypes, expected ${expectedSubStateTypes.join()} got '${subStateTypes.join(
      ' ',
    )}'`,
  )

const assertAddress = (
  type: 'from' | 'to',
  expected: AccountAddressT | ValidatorAddressT,
  actual: AccountAddressT | ValidatorAddressT,
) =>
  assert(
    expected.equals(actual),
    `incorrect ${type} address, expected '${expected.toPrimitive()}' got '${actual.toPrimitive()}'`,
  )

const assertNumberOfInstructions = (expected: number, actual: number) =>
  assert(
    expected === actual,
    `incorrect number of instructions, expected '${expected}' got '${actual}'`,
  )

const assertAmount = (expected: AmountT, actual: AmountT) =>
  assert(
    actual.eq(expected),
    `incorrect amount expected '${expected.toString()}' got '${actual.toString()}'`,
  )

const assertResource = (expected: ResourceIdentifierT, actual: string) => {
  const expectedHash = expected.hash.toString('hex')
  return assert(
    expectedHash === actual,
    `incorrect rri expected '${expectedHash}' got '${actual}'`,
  )
}

const assertSelfTransfer = (
  isSelfTransfer: boolean,
  expected: AmountT,
  actual: AmountT,
): Result<null, Error> =>
  isSelfTransfer ? ok(null) : assertAmount(expected, actual)

const flattenNullArray = (n: null[]) => n[0]

const verifyTransfer = (
  action: IntendedTransferTokensAction,
  instructions: TokensGroup,
): Result<null, Error[]> => {
  const [from, to] = instructions
  const isSelfTransfer = from.owner.equals(to.owner)

  return combineWithAllErrors([
    assertNumberOfInstructions(2, instructions.length),
    assertSubstateTypes(
      [SubStateType.TOKENS],
      instructions.map(({ substateType }) => substateType),
    ),
    assertAddress('from', action.from_account, from.owner),
    assertAddress('to', action.to_account, to.owner),
    assertResource(action.rri, from.resource),
    assertResource(action.rri, to.resource),
    assertSelfTransfer(isSelfTransfer, action.amount, to.amount),
  ]).map(flattenNullArray)
}

const verifyStake = (
  action: IntendedStakeTokensAction,
  instructions: PreparedStakeGroup,
): Result<null, Error[]> => {
  const [from, to] = instructions
  return combineWithAllErrors([
    assertNumberOfInstructions(2, instructions.length),
    assertSubstateTypes(
      [SubStateType.TOKENS, SubStateType.PREPARED_STAKE],
      instructions.map(({ substateType }) => substateType),
    ),
    assertAddress('from', action.from_account, from.owner),
    assertAddress('to', action.to_validator, to.validator),
    assertResource(action.rri, from.resource),
    assertAmount(action.amount, to.amount),
  ]).map(flattenNullArray)
}

const verifyUnstake = (
  action: IntendedUnstakeTokensAction,
  instructions: PreparedUnstakeGroup,
): Result<null, Error[]> => {
  const [from, to] = instructions
  return combineWithAllErrors([
    assertSubstateTypes(
      [SubStateType.PREPARED_UNSTAKE, SubStateType.STAKE_OWNERSHIP],
      instructions.map(({ substateType }) => substateType),
    ),
    assertAddress('from', action.from_validator, from.validator),
    assertAddress('to', action.to_account, to.owner),
  ]).map(flattenNullArray)
}

const verifyTxIntent = (txIntent: TransactionIntent) => (
  groups: InstructionGroup[],
) => {
  const [, ...instructionGroups] = groups

  return combine(
    txIntent.actions
      .map(
        (action, index): Result<null, Error[]> => {
          const currentGroup = instructionGroups[index]

          switch (action.type) {
            case ActionType.TRANSFER:
              return verifyTransfer(action, currentGroup as TokensGroup)

            case ActionType.STAKE:
              return verifyStake(action, currentGroup as PreparedStakeGroup)

            case ActionType.UNSTAKE:
              return verifyUnstake(action, currentGroup as PreparedUnstakeGroup)

            default:
              return ok(null)
          }
        },
      )
      .flatMap(item => item),
  )
}

export const verifyTx = (
  txIntent: TransactionIntent,
  network: Network,
  trackError: TrackError,
) => (tx: BuiltTransaction) => {
  return Transaction.fromBuffer(Buffer.from(tx.transaction.blob, 'hex'))
    .map(tx => {
      log.info(tx.toString())
      return tx.instructions
    })
    .map(filterUpAndEndInstructions)
    .map(groupInstructionsByActions)
    .map(parseGroupData(network))
    .andThen(group => combine(group))
    .map(groups =>
      groups.filter((group): group is InstructionGroup => group.length > 0),
    )
    .andThen(verifyTxIntent(txIntent))
    .map(() => tx)
    .mapErr(errors => {
      trackError({
        errors: [
          radixAPIError({
            message: 'transaction intent does not match built transaction',
            details: {
              type: 'VerifyBuiltTransactionError',
              errors: Array.isArray(errors)
                ? errors
                : errors === null
                ? []
                : [errors],
            },
          }),
        ],
        inStep: TransactionTrackingEventType.VERIFIED,
      })
      return errors
    })
}
