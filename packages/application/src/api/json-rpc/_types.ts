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
		address: string,
		size: number, // must be > 0
		cursor?: string, // AtomIdentifier
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
		cursor: string
		transactions: [
			{
				atomId: string
				sentAt: Date
				fee: AmountT
				message?: {
					msg: string
					encryptionScheme: string
				}
				actions: Action[]
			},
		]
	}
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
		isSupplyMutable: boolean
		currentSupply: AmountT
		tokenInfoURL: URL
		iconURL: URL
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
