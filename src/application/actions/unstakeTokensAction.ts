import { ActionType, IntendedUnstakeTokensAction } from './_types'
import {
  AccountAddressT,
  ResourceIdentifier,
  ResourceIdentifierT,
  ValidatorAddress,
  ValidatorAddressT,
  AccountAddress,
} from '@account'
import { combineWithAllErrors, Result, ok } from 'neverthrow'
import { Amount, AmountT } from '@primitives'
import { PrimitiveFrom } from '../_types'
import { UnstakeTokens } from '@networking'
import { pipe } from 'ramda'

const create = (
  input: Omit<
    PrimitiveFrom<IntendedUnstakeTokensAction>,
    'type' | 'amount' | 'rri'
  > & {
    amount?: string
    rri?: string
  },
): Result<IntendedUnstakeTokensAction, Error[]> =>
  combineWithAllErrors([
    ValidatorAddress.fromUnsafe(input.from_validator),
    AccountAddress.fromUnsafe(input.to_account),
    input.amount ? Amount.fromUnsafe(input.amount) : ok<void>(undefined),
    input.rri ? ResourceIdentifier.fromUnsafe(input.rri) : ok<void>(undefined),
  ]).map(results => ({
    from_validator: results[0] as ValidatorAddressT,
    to_account: results[1] as AccountAddressT,
    amount: results[2] as AmountT,
    rri: results[3] as ResourceIdentifierT,
    unstake_percentage: input.unstake_percentage,
    type: ActionType.UNSTAKE,
  }))

const transformResponse = (input: UnstakeTokens) => ({
  from_validator: input.from_validator.address,
  amount: input?.amount?.value,
  to_account: input.to_account.address,
  rri: input?.amount?.token_identifier.rri,
  unstake_percentage: input.unstake_percentage,
})

const toPrimitive = (action: IntendedUnstakeTokensAction) => ({
  type: ActionType.UNSTAKE,
  from_validator: {
    address: action.from_validator.toPrimitive(),
  },
  to_account: {
    address: action.to_account.toPrimitive(),
  },
  amount:
    action.amount && action.rri
      ? {
          value: action.amount.toPrimitive(),
          token_identifier: {
            rri: action.rri.toPrimitive(),
          },
        }
      : undefined,
  unstake_percentage: action.unstake_percentage,
})

export const unstakeTokensAction = {
  create,
  toPrimitive,
  toComplex: pipe(transformResponse, create),
}
