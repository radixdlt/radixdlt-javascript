import {
  AccountAddressT,
  ResourceIdentifierT,
  ValidatorAddressT,
} from '@account'
import {
  ActionInput,
  ActionType,
  ExecutedAction,
  IntendedAction,
  StakeTokensInput,
  TransferTokensInput,
  UnstakeTokensInput,
} from '../actions'
import { AmountT, BuiltTransactionReadyToSign } from '@primitives'
import { PublicKeyT, SignatureT } from '@crypto'
import { Observable } from 'rxjs'
import { Result } from 'neverthrow'
import { AccountT, TxMessage } from '../_types'
import { TransactionIdentifierT } from './transactionIdentifier'

export type StakePosition = {
  validator: ValidatorAddressT
  amount: AmountT
}

export type UnstakePosition = {
  validator: ValidatorAddressT
  amount: AmountT
  withdrawTxID: TransactionIdentifierT
  epochsUntil: number
}

export type TransactionIntentBuilderState = {
  actionInputs: ActionInput[]
  message?: TxMessage
}

export type TransactionIntentBuilderEncryptOption = {
  encryptMessageIfAnyWithAccount: Observable<AccountT>
  spendingSender?: Observable<AccountAddressT>
}

export type TransactionIntentBuilderDoNotEncryptInput = {
  spendingSender: Observable<AccountAddressT>
}

export type TransactionIntentBuilderDoNotEncryptOption = {
  skipEncryptionOfMessageIfAny: TransactionIntentBuilderDoNotEncryptInput
}
export type TransactionIntentBuilderOptions =
  | TransactionIntentBuilderDoNotEncryptOption
  | TransactionIntentBuilderEncryptOption

export type TransactionIntentBuilderT = {
  __state: TransactionIntentBuilderState

  transferTokens: (input: TransferTokensInput) => TransactionIntentBuilderT
  stakeTokens: (input: StakeTokensInput) => TransactionIntentBuilderT
  unstakeTokens: (input: UnstakeTokensInput) => TransactionIntentBuilderT
  message: (msg: TxMessage) => TransactionIntentBuilderT

  // Build
  __syncBuildDoNotEncryptMessageIfAny: (
    from: AccountAddressT,
  ) => Result<TransactionIntent, Error>

  build: (
    options: TransactionIntentBuilderOptions,
  ) => Observable<TransactionIntent>
}

export type TransactionIntent = {
  actions: IntendedAction[]
  message?: Buffer
}

export enum TransactionTrackingEventType {
  INITIATED = 'INITIATED',
  BUILT = 'BUILT',
  VERIFIED = 'VERIFIED',
  SIGNED = 'SIGNED',
  SUBMITTED = 'SUBMITTED',
  CONFIRMED = 'CONFIRMED',
  FINALIZED = 'FINALIZED',
  STATUS_UPDATE = 'STATUS_UPDATE',
  COMPLETED = 'COMPLETED',
}

export type TransactionStateSuccess<
  T extends TransactionState = TransactionState,
> = {
  eventUpdateType: TransactionTrackingEventType
  transactionState: T
}

export type TransactionStateError = {
  eventUpdateType: TransactionTrackingEventType
  error: Error
}

export type TransactionStateUpdate<
  T extends TransactionState = TransactionState,
> = TransactionStateSuccess<T> | TransactionStateError

export type TransactionState =
  | TransactionIntent
  | BuiltTransaction
  | SignedTransaction
  | FinalizedTransaction
  | PendingTransaction

export type TransactionHistoryOfKnownAddressRequestInput = {
  size: number
  cursor?: string
}

export type TransactionHistoryActiveAccountRequestInput =
  TransactionHistoryOfKnownAddressRequestInput

export type TransactionHistoryRequestInput =
  TransactionHistoryOfKnownAddressRequestInput & {
    address: AccountAddressT
  }

export type SimpleExecutedTransaction = {
  txID: TransactionIdentifierT
  sentAt: Date
  status: TransactionStatus
  fee: AmountT
  message?: TxMessage
  actions: ExecutedAction[]
}

export enum TransactionType {
  FROM_ME_TO_ME = 'FROM_ME_TO_ME',
  INCOMING = 'INCOMING',
  OUTGOING = 'OUTGOING',
  UNRELATED = 'UNRELATED',
}

export type ExecutedTransaction = SimpleExecutedTransaction & {
  transactionType: TransactionType
}

export type TokenAmount = {
  tokenIdentifier: ResourceIdentifierT
  amount: AmountT
}

export type SimpleTokenBalance = TokenAmount

export type TokenBalance = {
  token: Token
  amount: AmountT
}

export type Token = {
  name: string
  rri: ResourceIdentifierT
  symbol: string
  description?: string
  granularity: AmountT
  isSupplyMutable: boolean
  currentSupply: AmountT
  tokenInfoURL?: URL
  iconURL?: URL
}

export type StatusOfTransaction = {
  txID: TransactionIdentifierT
  status: TransactionStatus
}

export type BuiltTransaction = {
  transaction: BuiltTransactionReadyToSign
  fee: AmountT
}

export type SignedTransaction = {
  transaction: BuiltTransactionReadyToSign
  publicKeyOfSigner: PublicKeyT
  signature: SignatureT
}

export type FinalizedTransaction = {
  blob: string
  txID: TransactionIdentifierT
}

export type PendingTransaction = {
  txID: TransactionIdentifierT
}

export type RawToken = {
  name: string
  rri: string
  symbol: string
  description?: string
  granularity: string
  isSupplyMutable: boolean
  currentSupply: string
  tokenInfoURL: string
  iconURL: string
}

export type RawExecutedActionBase<T extends ActionType> = {
  type: T
}

export type RawOtherExecutedAction = RawExecutedActionBase<ActionType.OTHER>

export type RawTransferAction = RawExecutedActionBase<ActionType.TRANSFER> & {
  from: string
  to: string
  amount: string
  rri: string
}

export type RawStakesAction = RawExecutedActionBase<ActionType.STAKE> & {
  from: string
  validator: string
  amount: string
}

export type RawUnstakesAction = RawExecutedActionBase<ActionType.UNSTAKE> & {
  from: string
  validator: string
  amount: string
}

export type NetworkTransactionThroughput = {
  tps: number
}
export type NetworkTransactionDemand = NetworkTransactionThroughput

export enum TransactionStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
}

export type RawExecutedAction =
  | RawTransferAction
  | RawStakesAction
  | RawUnstakesAction
  | RawOtherExecutedAction

export type SimpleTokenBalances = {
  owner: AccountAddressT
  tokenBalances: SimpleTokenBalance[]
}

export type TokenBalances = {
  owner: AccountAddressT
  tokenBalances: TokenBalance[]
}

export type SimpleTransactionHistory = {
  cursor: string
  transactions: SimpleExecutedTransaction[]
}

export type TransactionHistory = SimpleTransactionHistory & {
  transactions: ExecutedTransaction[]
}

export type Validator = {
  address: ValidatorAddressT
  ownerAddress: AccountAddressT
  name: string
  infoURL: URL
  totalDelegatedStake: AmountT
  ownerDelegation: AmountT
  validatorFee: number
  registered: boolean
  isExternalStakeAccepted: boolean
  uptimePercentage: number
  proposalsMissed: number
  proposalsCompleted: number
}

export type Validators = {
  cursor: string
  validators: Validator[]
}

export type RawExecutedTransaction = {
  txID: string
  sentAt: string
  fee: string
  message?: string
  actions: RawExecutedAction[]
}

export type RawValidatorResponse = {
  address: string
  ownerAddress: string
  name: string
  infoURL: string
  totalDelegatedStake: string
  ownerDelegation: string
  validatorFee: string
  registered: boolean
  isExternalStakeAccepted: boolean
  uptimePercentage: string
  proposalsMissed: number
  proposalsCompleted: number
}

export type StakePositions = StakePosition[]

export type UnstakePositions = UnstakePosition[]
