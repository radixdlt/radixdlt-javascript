import {
  TokenInfoEndpoint,
  NativeTokenInfoEndpoint,
  AccountBalancesEndpoint,
  BuildTransactionEndpoint,
  FinalizeTransactionEndpoint,
  TransactionEndpoint,
  Decoded,
  StakePositionsEndpoint,
  UnstakePositionsEndpoint,
  AccountTransactionsEndpoint,
  ValidatorEndpoint,
  ValidatorsEndpoint,
  GatewayEndpoint,
} from './_types'
import { ReturnOfAPICall } from '@networking'
import { Result } from 'neverthrow'
import { ResourceIdentifier, ResourceIdentifierT } from '@account'
import { Amount, AmountT, Network } from '@primitives'
import {
  TxMessage,
  SimpleTransactionHistory,
  TransactionIdentifier,
} from '../..'
import { ok, combine } from 'neverthrow'
import * as responseHelper from './responseHelpers'
import { RadixError } from '@util'

export const handleGatewayResponse = (
  json: ReturnOfAPICall<'gatewayPost'>,
): Result<GatewayEndpoint.DecodedResponse, RadixError[]> =>
  ok({
    network: json.data.network_identifier.network as Network,
  }).mapErr(e => [e] as RadixError[])

export const handleTokenInfoResponse = (
  json: ReturnOfAPICall<'tokenPost'>,
): Result<TokenInfoEndpoint.DecodedResponse, RadixError[]> =>
  combine([
    ResourceIdentifier.fromUnsafe(json.data.token.token_identifier.rri),
    Amount.fromUnsafe(json.data.token.token_properties.granularity),
    Amount.fromUnsafe(json.data.token.token_supply.value),
  ])
    .map(responseHelper.transformToken(json.data.token))
    .mapErr(e => [e] as RadixError[])

export const handleNativeTokenResponse = (
  json: ReturnOfAPICall<'tokenNativePost'>,
): Result<NativeTokenInfoEndpoint.DecodedResponse, RadixError[]> =>
  combine([
    ResourceIdentifier.fromUnsafe(json.data.token.token_identifier.rri),
    Amount.fromUnsafe(json.data.token.token_properties.granularity),
    Amount.fromUnsafe(json.data.token.token_supply.value),
  ])
    .map(responseHelper.transformToken(json.data.token))
    .mapErr(e => [e] as RadixError[])

export const handleStakePositionsResponse = (
  json: ReturnOfAPICall<'accountStakesPost'>,
): Result<StakePositionsEndpoint.DecodedResponse, RadixError[]> =>
  combine(json.data.stakes.map(responseHelper.transformStakeEntry)).andThen(
    stakes =>
      combine(
        json.data.pending_stakes.map(responseHelper.transformStakeEntry),
      ).map(pendingStakes => ({ stakes, pendingStakes })),
  )

export const handleUnstakePositionsResponse = (
  json: ReturnOfAPICall<'accountUnstakesPost'>,
): Result<UnstakePositionsEndpoint.DecodedResponse, RadixError[]> => {
  return combine(
    json.data.pending_unstakes.map(responseHelper.transformUnstakeEntry),
  )
    .map(pendingUnstakes =>
      combine(json.data.unstakes.map(responseHelper.transformUnstakeEntry)).map(
        unstakes => ({
          pendingUnstakes,
          unstakes,
        }),
      ),
    )
    .andThen(res => res)
    .mapErr(e => [e] as RadixError[])
}

export const handleAccountTransactionsResponse = (
  json: ReturnOfAPICall<'accountTransactionsPost'>,
): Result<AccountTransactionsEndpoint.DecodedResponse, RadixError[]> =>
  combine(json.data.transactions.map(responseHelper.transformTransaction)).map(
    (transactions): SimpleTransactionHistory => ({
      cursor: json.data.next_cursor || '',
      transactions,
    }),
  )

export const handleAccountBalancesResponse = (
  json: ReturnOfAPICall<'accountBalancesPost'>,
): Result<AccountBalancesEndpoint.DecodedResponse, RadixError[]> =>
  combine([
    combine(
      json.data.account_balances.liquid_balances.map(balance =>
        combine([
          Amount.fromUnsafe(balance.value),
          ResourceIdentifier.fromUnsafe(balance.token_identifier.rri),
        ]).map(values => ({
          value: values[0] as AmountT,
          token_identifier: {
            rri: values[1] as ResourceIdentifierT,
          },
        })),
      ),
    ).map(balances => ({ balances })),
    combine([
      ResourceIdentifier.fromUnsafe(
        json.data.account_balances.staked_and_unstaking_balance.token_identifier
          .rri,
      ),
      Amount.fromUnsafe(
        json.data.account_balances.staked_and_unstaking_balance.value,
      ),
    ]),
  ])
    .map(values => ({
      ledger_state: {
        ...json.data.ledger_state,
        timestamp: new Date(json.data.ledger_state.timestamp),
      },
      account_balances: {
        // @ts-ignore
        liquid_balances: values[0].balances as Decoded.TokenAmount[],
        staked_and_unstaking_balance: {
          token_identifier: {
            rri: values[1] as unknown as ResourceIdentifierT,
          },
          value: values[2] as unknown as AmountT,
        },
      },
    }))
    .mapErr(e => [e] as RadixError[])

export const handleValidatorResponse = (
  json: ReturnOfAPICall<'validatorPost'>,
): Result<ValidatorEndpoint.DecodedResponse, RadixError[]> =>
  responseHelper.transformValidator(json.data.validator)

export const handleValidatorsResponse = (
  json: ReturnOfAPICall<'validatorsPost'>,
): Result<ValidatorsEndpoint.DecodedResponse, RadixError[]> =>
  combine(json.data.validators.map(responseHelper.transformValidator)).map(
    validators => ({ validators }),
  )

export const handleBuildTransactionResponse = (
  json: ReturnOfAPICall<'transactionBuildPost'>,
): Result<BuildTransactionEndpoint.DecodedResponse, RadixError[]> =>
  Amount.fromUnsafe(json.data.transaction_build.fee.value)
    .map(amount => ({
      transaction: {
        blob: json.data.transaction_build.unsigned_transaction,
        hashOfBlobToSign: json.data.transaction_build.payload_to_sign,
      },
      fee: amount,
    }))
    .mapErr(e => [e] as RadixError[])

export const handleFinalizeTransactionResponse = (
  json: ReturnOfAPICall<'transactionFinalizePost'>,
): Result<FinalizeTransactionEndpoint.DecodedResponse, RadixError[]> =>
  TransactionIdentifier.create(json.data.transaction_identifier.hash)
    .map(txID => ({
      blob: json.data.signed_transaction,
      txID,
    }))
    .mapErr(e => [e] as RadixError[])

export const handleSubmitTransactionResponse = (
  json: ReturnOfAPICall<'transactionSubmitPost'>,
) =>
  TransactionIdentifier.create(json.data.transaction_identifier.hash)
    .map(txID => ({
      txID,
    }))
    .mapErr(e => [e] as RadixError[])

export const handleTransactionResponse = ({
  data: { transaction },
}: ReturnOfAPICall<'transactionStatusPost'>): Result<
  TransactionEndpoint.DecodedResponse,
  RadixError[]
> => responseHelper.transformTransaction(transaction)
