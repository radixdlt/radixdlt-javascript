import { ActionType, ExecutedStakeTokensAction } from './_types'
import {
  AccountAddressT,
  ValidatorAddress,
  ValidatorAddressT,
  ResourceIdentifier,
  ResourceIdentifierT,
  AccountAddress,
} from '@account'
import { Amount, AmountT } from '@primitives'
import { combineWithAllErrors, Result } from 'neverthrow'
import { PrimitiveFrom } from '../_types'
import { StakeTokens } from '@networking'
import { pipe } from 'ramda'
import { IntendedStakeTokensAction } from '.'

type PrimitiveStake = PrimitiveFrom<IntendedStakeTokensAction>

const create = (
  input: Omit<PrimitiveStake, 'type'>,
): Result<IntendedStakeTokensAction, Error[]> =>
  combineWithAllErrors([
    ValidatorAddress.fromUnsafe(input.to_validator),
    Amount.fromUnsafe(input.amount),
    AccountAddress.fromUnsafe(input.from_account),
    ResourceIdentifier.fromUnsafe(input.rri),
  ]).map(results => ({
    to_validator: results[0] as ValidatorAddressT,
    amount: results[1] as AmountT,
    from_account: results[2] as AccountAddressT,
    rri: results[3] as ResourceIdentifierT,
    type: ActionType.STAKE,
  }))

const transformResponse = (input: StakeTokens) => ({
  to_validator: input.to_validator.address,
  amount: input.amount.value,
  from_account: input.from_account.address,
  rri: input.amount.token_identifier.rri,
})

const toPrimitive = (action: IntendedStakeTokensAction) => ({
  type: ActionType.STAKE,
  from_account: {
    address: action.from_account.toPrimitive(),
  },
  to_validator: {
    address: action.to_validator.toPrimitive(),
  },
  amount: {
    value: action.amount.toPrimitive(),
    token_identifier: {
      rri: action.rri.toPrimitive(),
    },
  },
})

export const stakeTokensAction = {
  create,
  toPrimitive,
  toComplex: pipe(transformResponse, create),
}
