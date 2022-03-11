import { ValidatorEndpoint } from './_types'
import {
  ReturnOfAPICall,
  Validator as ValidatorRaw,
  AccountStakeEntry,
  AccountUnstakeEntry,
  Token,
} from '@networking'
import {
  ValidatorAddress,
  ValidatorAddressT,
  AccountAddress,
  AccountAddressT,
  ResourceIdentifierT,
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
import { ok, combine, Result, err } from 'neverthrow'
import { Message } from '@crypto'
import { ExecutedAction, transformAction } from '../../actions'
import { RadixError } from '@util'

export const transformUnstakeEntry = (item: AccountUnstakeEntry) =>
  combine([
    ValidatorAddress.fromUnsafe(item.validator_identifier.address),
    Amount.fromUnsafe(item.unstaking_amount.value),
    ok<number, Error>(item.epochs_until_unlocked),
  ]).map(value => ({
    validator: value[0] as ValidatorAddressT,
    amount: value[1] as AmountT,
    epochsUntil: value[2] as number,
  }))

export const transformUrl = (url: string) => {
  try {
    return new URL(url)
  } catch (error) {
    return undefined
  }
}

export const transformMessage = (message: string): Result<TxMessage, Error> => {
  if (!/^(00|01|30)[0-9a-fA-F]+$/.test(message))
    return err(Error('Message format invalid.'))

  if (Message.isHexEncoded(message)) {
    const decoded = Message.plaintextToString(Buffer.from(message, 'hex'), 0)
    return transformMessage(decoded)
  }

  return Message.isPlaintext(message)
    ? ok({
        raw: Message.plaintextToString(Buffer.from(message, 'hex')),
        encrypted: false,
      })
    : ok({
        raw: message,
        encrypted: true,
      })
}

export const transformTransaction = (
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
    .mapErr(e => [e] as RadixError[])

export const transformStakeEntry = (stake: AccountStakeEntry) =>
  combine([
    ValidatorAddress.fromUnsafe(stake.validator_identifier.address),
    Amount.fromUnsafe(stake.delegated_stake.value),
  ])
    .map(value => ({
      validator: value[0] as ValidatorAddressT,
      amount: value[1] as AmountT,
    }))
    .mapErr(e => [e] as RadixError[])

export const transformValidator = (validator: ValidatorRaw) =>
  combine([
    ValidatorAddress.fromUnsafe(validator.validator_identifier.address),
    AccountAddress.fromUnsafe(
      validator.properties.owner_account_identifier.address,
    ),
    Amount.fromUnsafe(validator.stake.value),
    Amount.fromUnsafe(validator.info.owner_stake.value),
  ])
    .map(
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
    .mapErr(e => [e] as RadixError[])

export const transformToken =
  (token: Token) => (values: (ResourceIdentifierT | AmountT)[]) => ({
    name: token.token_properties.name ?? '',
    rri: values[0] as ResourceIdentifierT,
    symbol: token.token_properties.symbol,
    description: token.token_properties.description,
    granularity: values[1] as AmountT,
    isSupplyMutable: token.token_properties.is_supply_mutable,
    currentSupply: values[2] as AmountT,
    tokenInfoURL: transformUrl(token.token_properties.url),
    iconURL: transformUrl(token.token_properties.icon_url),
  })
