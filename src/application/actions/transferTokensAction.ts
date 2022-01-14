import { ActionType, IntendedTransferTokensAction } from './_types'
import { TransferTokens } from '@networking'
import {
  AccountAddress,
  AccountAddressT,
  ResourceIdentifierT,
  ResourceIdentifier,
} from '@account'
import { Amount, AmountT } from '@primitives'
import { combineWithAllErrors, Result } from 'neverthrow'
import { PrimitiveFrom } from '../_types'
import { pipe } from 'ramda'

const create = (
  input: Omit<
    PrimitiveFrom<IntendedTransferTokensAction>,
    'type' | 'amount'
  > & {
    amount: string
  },
): Result<IntendedTransferTokensAction, Error[]> =>
  combineWithAllErrors([
    AccountAddress.fromUnsafe(input.from_account),
    AccountAddress.fromUnsafe(input.to_account),
    Amount.fromUnsafe(input.amount),
    ResourceIdentifier.fromUnsafe(input.rri),
  ]).map(results => ({
    from_account: results[0] as AccountAddressT,
    to_account: results[1] as AccountAddressT,
    amount: results[2] as AmountT,
    rri: results[3] as ResourceIdentifierT,
    type: ActionType.TRANSFER,
  }))

const transformResponse = (input: TransferTokens) => ({
  to_account: input.to_account.address,
  amount: input.amount.value,
  from_account: input.from_account.address,
  rri: input.amount.token_identifier.rri,
})

const toPrimitive = (action: IntendedTransferTokensAction) => ({
  type: ActionType.TRANSFER,
  from_account: {
    address: action.from_account.toPrimitive(),
  },
  to_account: {
    address: action.to_account.toPrimitive(),
  },
  amount: {
    value: action.amount.toPrimitive(),
    token_identifier: {
      rri: action.rri.toPrimitive(),
    },
  },
})

export const transferTokensAction = {
  create,
  toPrimitive,
  toComplex: pipe(transformResponse, create),
}
