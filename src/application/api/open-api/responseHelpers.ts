import { ValidatorEndpoint } from './_types'
import {
  ReturnOfAPICall,
  Validator as ValidatorRaw,
  AccountStakeEntry,
} from '@networking'
import {
  ValidatorAddress,
  ValidatorAddressT,
  AccountAddress,
  AccountAddressT,
} from '@account'
import { Amount, AmountT } from '@primitives'
import {
  ExecutedTransaction,
  SimpleExecutedTransaction,
  TransactionIdentifier,
  TransactionIdentifierT,
  TransactionStatus,
  TxMessage,
} from '../..'
import { ok, combine } from 'neverthrow'
import { Message } from '@crypto'
import { ExecutedAction, transformAction } from '../../actions'
import { transformMessage } from './responseHandlers'

const transformUrl = (url: string) => {
  try {
    return new URL(url)
  } catch (error) {
    return undefined
  }
}

const transformTransaction = (
  transaction: ReturnOfAPICall<'transactionStatusPost'>['data']['transaction'],
) =>
  combine([
    TransactionIdentifier.create(transaction.transaction_identifier.hash),
    ok(
      transaction.transaction_status.confirmed_time
        ? new Date(transaction.transaction_status.confirmed_time)
        : undefined,
    ),
    Amount.fromUnsafe(transaction.fee_paid.value),
    transaction.metadata.message
      ? transformMessage(transaction.metadata.message)
      : ok(undefined),
    combine(transaction.actions.map(transformAction.toComplex)).map(
      actions => ({
        actions,
      }),
    ),
    ok(transaction.transaction_status.status),
  ])
    .map(
      (value): SimpleExecutedTransaction => ({
        txID: value[0] as TransactionIdentifierT,
        sentAt: value[1] as Date,
        fee: value[2] as AmountT,
        message: value[3] as TxMessage | undefined,
        // @ts-ignore
        actions: value[4].actions as ExecutedAction[],
        // @ts-ignore
        status: value[5] as TransactionStatus,
      }),
    )
    .mapErr(e => [e] as Error[])

const transformStakeEntry = (stake: AccountStakeEntry) =>
  combine([
    ValidatorAddress.fromUnsafe(stake.validator_identifier.address),
    Amount.fromUnsafe(stake.delegated_stake.value),
  ]).map(value => ({
    validator: value[0] as ValidatorAddressT,
    amount: value[1] as AmountT,
  }))

const transformValidator = (validator: ValidatorRaw) =>
  combine([
    ValidatorAddress.fromUnsafe(validator.validator_identifier.address),
    AccountAddress.fromUnsafe(
      validator.properties.owner_account_identifier.address,
    ),
    Amount.fromUnsafe(validator.stake.value),
    Amount.fromUnsafe(validator.info.owner_stake.value),
  ]).map(
    (values): ValidatorEndpoint.DecodedResponse => ({
      address: values[0] as ValidatorAddressT,
      ownerAddress: values[1] as AccountAddressT,
      name: validator.properties.name,
      infoURL: transformUrl(validator.properties.url),
      totalDelegatedStake: values[2] as AmountT,
      ownerDelegation: values[3] as AmountT,
      validatorFee: validator.properties.validator_fee_percentage,
      registered: validator.properties.registered,
      isExternalStakeAccepted: validator.properties.external_stake_accepted,
      uptimePercentage: validator.info.uptime.uptime_percentage,
      proposalsMissed: validator.info.uptime.proposals_missed,
      proposalsCompleted: validator.info.uptime.proposals_completed,
    }),
  )

export const responseHelper = {
  transformValidator,
  transformStakeEntry,
  transformTransaction,
}
