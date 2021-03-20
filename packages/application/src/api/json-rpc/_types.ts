import { AddressT, Int32 } from '@radixdlt/account'
import {
	BurnTokensActionT,
	TransferTokensActionT,
	UserActionType,
} from '@radixdlt/actions'
import {
	AtomIdentifierT,
	ResourceIdentifierT,
	TokenPermissions,
	TokenPermission,
} from '@radixdlt/atom'
import { AmountT } from '@radixdlt/primitives'
import { UInt256 } from '@radixdlt/uint256'

export enum Endpoint {
	UNIVERSE_MAGIC = 'radix.universeMagic',
	TOKEN_BALANCES = 'radix.tokenBalances',
	EXECUTED_TXS = 'radix.executedTransactions',
	STAKES = 'radix.stakes',
	UNSTAKES = 'radix.unstakes',
	TX_STATUS = 'radix.transactionStatus',
	NETWORK_TX_THROUGHPUT = 'radix.networkTransactionThroughput',
	NETWORK_TX_DEMAND = 'radix.networkTransactionDemand',
	VALIDATORS = 'radix.validators',
	NATIVE_TOKEN = 'radix.nativeToken',
	TOKEN_FEE_FOR_TX = 'radix.tokenFeeForTransaction',
	GET_ATOM_FOR_TX = 'radix.getAtomForTransaction',
	SUBMIT_SIGNED_ATOM = 'radix.submitSignedAtom',
}

type Action = TransferTokensActionT | BurnTokensActionT

export type Transaction = {
	message: {
		msg: string
		encryptionScheme: string
	}
	actions: Action[]
}

export namespace UniverseMagic {
	export type Input = []

	export type Response = {
		magic: Int32
	}

	export type DecodedResponse = {
		magic: Int32
	}
}

export namespace TokenBalances {
	export type Input = [address: string]

	export type Response = {
		owner: string
		tokenBalances: [
			{
				token: string
				amount: string
			},
		]
	}

	export type DecodedResponse = {
		owner: AddressT
		tokenBalances: [
			{
				token: ResourceIdentifierT
				amount: AmountT
			},
		]
	}
}

export type PositiveNumber = Readonly<{
	// We DONT need 256 bits... but we need UNSIGNED, and this is the only unsigned type we have, now we only need to ensure that
	// the value is not zero.
	value: UInt256
}>

export namespace ExecutedTransactions {
	type RawTransferAction = {
		type: UserActionType
		from: string
		to: string
		amount: string
		resourceIdentifier: string
	}

	type RawBurnAction = {
		type: UserActionType
		burner: string
		amount: string
		resourceIdentifier: string
	}

	export type Input = [
		address: AddressT,
		size: PositiveNumber,
		cursor?: AtomIdentifierT,
	]

	export type Response = {
		cursor: string
		transactions: {
			atomId: string
			sentAt: string
			fee: string
			message?: {
				msg: string
				encryptionScheme: string
			}
			actions: (RawTransferAction | RawBurnAction)[]
		}[]
	}

	export type DecodedResponse = {
		cursor: AtomIdentifierT
		transactions: [
			{
				atomId: AtomIdentifierT
				type: TransactionType
				sentAt: Date
				fee: AmountT
				message?: {
					msg: EncryptedMessage
					encryptionScheme: EncryptionScheme
				}
				actions: Action[]
			},
		]
	}
}

export type EncryptedMessage = Readonly<{
	buffer: Buffer
}>

export enum EncryptionScheme {
	UNKNOWN = 'unknown',
	ECIES_DH_ADD_AES_GCM_V0 = 'ECIES_DH_ADD_AES_GCM_V0',
}

export enum TransactionType {
	// Sent _TO_ active account
	INCOMING = 'incoming',
	// Sent _FROM_ active account
	OUTGOING = 'outgoing',
	// A transaction from someone else to someone else (N.B. that "someone else" might very well be yourself, but just not the active account.)
	UNRELATED = 'unrelated',
}

export namespace NativeToken {
	export type Input = []

	export type Response = {
		name: string
		rri: string
		symbol: string
		description?: string
		granularity: string
		isSupplyMutable: boolean
		currentSupply: string
		tokenInfoURL: string
		iconURL: string
		tokenPermission: {
			burn: TokenPermission
			mint: TokenPermission
		}
	}

	export type DecodedResponse = {
		name: string
		rri: ResourceIdentifierT
		symbol: string
		description?: string
		granularity: AmountT
		hasMutableSupply: boolean
		currentSupply: AmountT
		iconURL: URL
		tokenInfoURL: URL
		tokenPermission: TokenPermissions
	}
}

export namespace TokenFeeForTransaction {
	export type Input = [transaction: Transaction]

	export type Response = {
		tokenFee: string
	}

	export type DecodedResponse = {
		tokenFee: AmountT
	}
}

export namespace Stakes {
	export type Input = [address: string]

	export type Response = {
		validator: string
		amount: string
	}[]

	export type DecodedResponse = {
		validator: AddressT
		amount: AmountT
	}[]
}

export namespace Unstakes {
	// TODO
}

export namespace TransactionStatus {
	export type Status = 'PENDING' | 'CONFIRMED' | 'FAILED'

	export type Input = [atomIdentifier: string]

	export type Response = {
		atomIdentifier: string
		status: Status
		failure?: string
	}

	export type DecodedResponse = {
		atomIdentifier: AtomIdentifierT
		status: Status
		failure?: string
	}
}

export namespace NetworkTransactionThroughput {
	export type Input = []

	export type Response = {
		tps: number
	}

	export type DecodedResponse = Response
}

export namespace NetworkTransactionDemand {
	export type Input = []

	export type Response = {
		tps: number
	}

	export type DecodedResponse = Response
}

export namespace Validators {
	// TODO
}

export namespace GetAtomForTransaction {
	export type Failure =
		| 'MALFORMED_TX'
		| 'INSUFFICIENT_FUNDS'
		| 'NOT_PERMITTED'

	export type Input = [transaction: Transaction]

	export type Response = {
		atomCBOR: string
		failure?: Failure
	}

	export type DecodedResponse = Response
}

export namespace SubmitSignedAtom {
	export type Failure =
		| 'INVALID_PUB_KEY'
		| 'INVALID_SIGNATURE'
		| 'MALFORMED_ATOM_CBOR'
		| 'INSUFFICIENT_FUNDS'

	export type Input = [
		atomCBOR: string,
		signerPublicKey: string,
		signatureDER: string,
	]

	export type Response = {
		atomIdentifier: string
		failure?: Failure
	}

	export type DecodedResponse = {
		atomIdentifier: AtomIdentifierT
		failure?: Failure
	}
}
