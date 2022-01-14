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
import { RadixError } from '@util'

export const radixAPI = (api: GatewayAPI) => ({
  validators: (
    network: string,
  ): ResultAsync<ValidatorsEndpoint.DecodedResponse, RadixError[]> =>
    api['validators']({ network_identifier: { network } }),

  lookupValidator: (
    input: ValidatorAddressT,
  ): ResultAsync<ValidatorEndpoint.DecodedResponse, RadixError[]> =>
    api['validator']({
      network_identifier: { network: input.network },
      validator_identifier: { address: input.toPrimitive() },
    }),

  networkId: (): ResultAsync<GatewayEndpoint.DecodedResponse, RadixError[]> =>
    api['gateway']({}),

  tokenBalancesForAddress: (
    address: AccountAddressT,
  ): ResultAsync<AccountBalancesEndpoint.DecodedResponse, RadixError[]> =>
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
    RadixError[]
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
  ): ResultAsync<NativeTokenInfoEndpoint.DecodedResponse, RadixError[]> =>
    api['nativeTokenInfo'](input),

  tokenInfo: (
    rri: ResourceIdentifierT,
  ): ResultAsync<TokenInfoEndpoint.DecodedResponse, RadixError[]> =>
    api['tokenInfo']({
      network_identifier: { network: rri.network },
      token_identifier: {
        rri: rri.toPrimitive(),
      },
    }),

  stakesForAddress: (
    address: AccountAddressT,
  ): ResultAsync<StakePositionsEndpoint.DecodedResponse, RadixError[]> =>
    api['stakePositions']({
      network_identifier: { network: address.network },
      account_identifier: {
        address: address.toPrimitive(),
      },
    }),

  unstakesForAddress: (
    address: AccountAddressT,
  ): ResultAsync<UnstakePositionsEndpoint.DecodedResponse, RadixError[]> =>
    api['unstakePositions']({
      network_identifier: { network: address.network },
      account_identifier: {
        address: address.toPrimitive(),
      },
    }),

  transactionStatus: (
    txID: TransactionIdentifierT,
    network: string,
  ): ResultAsync<TransactionEndpoint.DecodedResponse, RadixError[]> =>
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
  ): ResultAsync<FinalizeTransactionEndpoint.DecodedResponse, RadixError[]> =>
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
  ): ResultAsync<SubmitTransactionEndpoint.DecodedResponse, RadixError[]> =>
    api['submitTransaction']({
      network_identifier: { network },
      signed_transaction: finalizedTx.blob,
    }),
})
