import { GatewayAPI } from './_types'
import {
  AccountAddressT,
  ResourceIdentifierT,
  ValidatorAddressT,
} from '@account'
import {
  FinalizedTransaction,
  SignedTransaction,
  TransactionHistoryRequestInput,
  TransactionIdentifierT,
  TransactionIntent,
} from '../dto'
import { pipe } from 'ramda'
import {
  GatewayEndpoint,
  ValidatorsEndpoint,
  ValidatorEndpoint,
  AccountBalancesEndpoint,
  AccountTransactionsEndpoint,
  NativeTokenInfoEndpoint,
  TokenInfoEndpoint,
  StakePositionsEndpoint,
  UnstakePositionsEndpoint,
  TransactionEndpoint,
  FinalizeTransactionEndpoint,
  SubmitTransactionEndpoint,
} from '../api/open-api/_types'
import { ResultAsync } from 'neverthrow'
import { transformAction } from '../actions'

export const radixAPI = (api: GatewayAPI) => ({
  validators: (
    network: string,
  ): ResultAsync<ValidatorsEndpoint.DecodedResponse, Error[]> =>
    api['validators']({ network_identifier: { network } }),

  lookupValidator: (
    input: ValidatorAddressT,
  ): ResultAsync<ValidatorEndpoint.DecodedResponse, Error[]> =>
    api['validator']({
      network_identifier: { network: input.network },
      validator_identifier: { address: input.toPrimitive() },
    }),

  networkId: (): ResultAsync<GatewayEndpoint.DecodedResponse, Error[]> =>
    api['gateway']({}),

  tokenBalancesForAddress: (
    address: AccountAddressT,
  ): ResultAsync<AccountBalancesEndpoint.DecodedResponse, Error[]> =>
    api['accountBalances']({
      network_identifier: { network: address.network },
      account_identifier: {
        address: address.toPrimitive(),
      },
    }),

  transactionHistory: ({
    address,
    size: limit,
    cursor,
  }: TransactionHistoryRequestInput): ResultAsync<
    AccountTransactionsEndpoint.DecodedResponse,
    Error[]
  > =>
    api['accountTransactions']({
      account_identifier: {
        address: address.toPrimitive(),
      },
      network_identifier: { network: address.network },
      limit,
      cursor,
    }),

  nativeToken: (
    input: NativeTokenInfoEndpoint.Input,
  ): ResultAsync<NativeTokenInfoEndpoint.DecodedResponse, Error[]> =>
    api['nativeTokenInfo'](input),

  tokenInfo: (
    rri: ResourceIdentifierT,
  ): ResultAsync<TokenInfoEndpoint.DecodedResponse, Error[]> =>
    api['tokenInfo']({
      network_identifier: { network: rri.network },
      token_identifier: {
        rri: rri.toPrimitive(),
      },
    }),

  stakesForAddress: (
    address: AccountAddressT,
  ): ResultAsync<StakePositionsEndpoint.DecodedResponse, Error[]> =>
    api['stakePositions']({
      network_identifier: { network: address.network },
      account_identifier: {
        address: address.toPrimitive(),
      },
    }),

  unstakesForAddress: (
    address: AccountAddressT,
  ): ResultAsync<UnstakePositionsEndpoint.DecodedResponse, Error[]> =>
    api['unstakePositions']({
      network_identifier: { network: address.network },
      account_identifier: {
        address: address.toPrimitive(),
      },
    }),

  transactionStatus: (
    txID: TransactionIdentifierT,
    network: string,
  ): ResultAsync<TransactionEndpoint.DecodedResponse, Error[]> =>
    api['getTransaction']({
      network_identifier: { network },
      transaction_identifier: {
        hash: txID.toPrimitive(),
      },
    }),

  buildTransaction: (from: AccountAddressT) =>
    pipe(
      (transactionIntent: TransactionIntent) => ({
        network_identifier: { network: from.network },
        actions: transactionIntent.actions.map(transformAction.toPrimitive),
        fee_payer: {
          address: from.toPrimitive(),
        },
        message: transactionIntent.message
          ? transactionIntent.message.toString('hex')
          : undefined,
        disable_token_mint_and_burn: true,
      }),
      api['buildTransaction'],
    ),

  finalizeTransaction: (
    network: string,
    signedTransaction: SignedTransaction,
  ): ResultAsync<FinalizeTransactionEndpoint.DecodedResponse, Error[]> =>
    api['finalizeTransaction']({
      network_identifier: { network },
      unsigned_transaction: signedTransaction.transaction.blob,
      signature: {
        bytes: signedTransaction.signature.toDER(),
        public_key: {
          hex: signedTransaction.publicKeyOfSigner.toString(),
        },
      },
    }),

  submitSignedTransaction: (
    network: string,
    finalizedTx: FinalizedTransaction,
  ): ResultAsync<SubmitTransactionEndpoint.DecodedResponse, Error[]> =>
    api['submitTransaction']({
      network_identifier: { network },
      signed_transaction: finalizedTx.blob,
    }),
})
