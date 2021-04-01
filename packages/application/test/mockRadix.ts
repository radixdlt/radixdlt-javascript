import {
	Amount,
	AmountT,
	Denomination,
	isAmount,
	Magic,
	magicFromNumber,
	maxAmount,
} from '@radixdlt/primitives'
import { UInt256 } from '@radixdlt/uint256'
import { Address, AddressT } from '@radixdlt/account'
import { Observable, of, throwError } from 'rxjs'
import {
	ExecutedTransaction,
	NetworkTransactionDemand,
	NetworkTransactionThroughput,
	PendingTransaction,
	ResourceIdentifierT,
	SignedTransaction,
	StakePositions,
	StatusOfTransaction,
	Token,
	TokenBalance,
	TokenBalances,
	TransactionHistory,
	TransactionHistoryRequestInput,
	TransactionIdentifierT,
	TransactionIntent,
	TransactionStatus,
	UnsignedTransaction,
	UnstakePositions,
	Validators,
	ValidatorsRequestInput,
} from '../src/dto/_types'
import { ResourceIdentifier } from '../src/dto/resourceIdentifier'
import {
	tokenOwnerOnly,
	tokenPermissionsAll,
} from '../src/dto/tokenPermissions'
import { RadixCoreAPI } from '../src/api/_types'
import { delay, shareReplay } from 'rxjs/operators'
import { privateKeyFromBuffer, PublicKey, sha256 } from '@radixdlt/crypto'
import { ActionType, ExecutedAction } from '../src/actions/_types'
import { TransactionIdentifier } from '../src/dto/transactionIdentifier'
import { toAddress } from '../../account/test/address.test'
import { StakePosition, UnstakePosition } from '../src/dto/_types'

export const xrd: Token = {
	name: 'Rad',
	rri: ResourceIdentifier.fromString(
		'/9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT/XRD',
	)._unsafeUnwrap(),
	symbol: 'XRD',
	description: 'The native coin of Radix network',
	granularity: Amount.fromUInt256({
		magnitude: UInt256.valueOf(1),
		denomination: Denomination.Whole,
	})._unsafeUnwrap(),
	isSupplyMutable: false,
	currentSupply: maxAmount,
	tokenInfoURL: new URL('http://www.radixdlt.com'),
	iconURL: new URL('http://www.image.radixdlt.com/'),
	tokenPermission: tokenPermissionsAll,
}

export const fooToken: Token = {
	name: 'Foo token',
	rri: ResourceIdentifier.fromString(
		'/9SAGS7iVkjLDa2uoqzvybBJZP5RJd6XLzoeSmqur9WWXoKs7hPqz/FOO',
	)._unsafeUnwrap(),
	symbol: 'FOO',
	description: 'FOOest token.',
	granularity: Amount.fromUInt256({
		magnitude: UInt256.valueOf(1),
		denomination: Denomination.Whole,
	})._unsafeUnwrap(),
	isSupplyMutable: false,
	currentSupply: maxAmount,
	tokenInfoURL: new URL('http://www.footoken.com'),
	iconURL: new URL('http://www.image.footoken.com/'),
	tokenPermission: tokenPermissionsAll,
}

export const barToken: Token = {
	name: 'Bar token',
	rri: ResourceIdentifier.fromString(
		'/9S8toEsjy7bLLVYwenrygbEiQDBiSYen4GDEGan5y6nGMXzKT22G/BAR',
	)._unsafeUnwrap(),
	symbol: 'BAR',
	description: 'Bar token. Granularity E-3.',
	granularity: Amount.fromUInt256({
		magnitude: UInt256.valueOf(1),
		denomination: Denomination.Milli,
	})._unsafeUnwrap(),
	isSupplyMutable: true,
	currentSupply: maxAmount,
	tokenInfoURL: new URL('http://www.bartoken.com'),
	iconURL: new URL('http://www.image.bartoken.com/'),
	tokenPermission: tokenPermissionsAll,
}

export const goldToken: Token = {
	name: 'Gold token',
	rri: ResourceIdentifier.fromString(
		'/9SAihkYQDBKvHfhvwEw4QBfx1rpjvta2TvmWibyXixVzX2JHHHWf/BAR',
	)._unsafeUnwrap(),
	symbol: 'GOLD',
	description: 'Gold token. Granularity E-12.',
	granularity: Amount.fromUInt256({
		magnitude: UInt256.valueOf(1),
		denomination: Denomination.Pico,
	})._unsafeUnwrap(),
	isSupplyMutable: false,
	currentSupply: maxAmount,
	tokenInfoURL: new URL('http://www.goldtoken.com'),
	iconURL: new URL('http://www.image.goldtoken.com/'),
	tokenPermission: tokenOwnerOnly,
}

export const radixWrappedBitcoinToken: Token = {
	name: 'Bitcoin (wrapped on Radix)',
	rri: ResourceIdentifier.fromString(
		'/9SBaXGCwn8HcyPsbu4ymzNVCXtvogf3vSqnH39ihqt5RyDFq9hsv/BTCRW',
	)._unsafeUnwrap(),
	symbol: 'BTCRW',
	description: 'Radix wrapped Bitcoin. Granularity E-18.',
	granularity: Amount.fromUInt256({
		magnitude: UInt256.valueOf(1),
		denomination: Denomination.Atto,
	})._unsafeUnwrap(),
	isSupplyMutable: true,
	currentSupply: maxAmount,
	tokenInfoURL: new URL('http://www.bitcoin.radix.com'),
	iconURL: new URL('http://www.image.bitcoin.radix.com/'),
	tokenPermission: tokenPermissionsAll,
}

export const radixWrappedEtherToken: Token = {
	name: 'Ether (wrapped on Radix)',
	rri: ResourceIdentifier.fromString(
		'/9SBA2tji3wjuuThohxW37L6vySVuVaUpBFBpq2b7Ey7sKToU2uJp/ETHRW',
	)._unsafeUnwrap(),
	symbol: 'ETHRW',
	description: 'Radix wrapped Ether. Granularity E-9.',
	granularity: Amount.fromUInt256({
		magnitude: UInt256.valueOf(1),
		denomination: Denomination.Nano,
	})._unsafeUnwrap(),
	isSupplyMutable: true,
	currentSupply: maxAmount,
	tokenInfoURL: new URL('http://www.ether.radix.com'),
	iconURL: new URL('http://www.image.ether.radix.com/'),
	tokenPermission: tokenPermissionsAll,
}

export const __fallBackAlexToken: Token = {
	name: 'Alex token',
	rri: ResourceIdentifier.fromString(
		'/9S8LZFHXHTSJqNQ86ZeGKtFMJtqZbYPtgHWSC4LyYjSbduNRpDNN/ALEX',
	)._unsafeUnwrap(),
	symbol: 'ALEX',
	description:
		'Fallback token for when token for requested symbol was not found.',
	granularity: Amount.fromUInt256({
		magnitude: UInt256.valueOf(1),
		denomination: Denomination.Whole,
	})._unsafeUnwrap(),
	isSupplyMutable: true,
	currentSupply: maxAmount,
	tokenInfoURL: new URL('http://www.alex.token.com'),
	iconURL: new URL('http://www.image.alex.token.com/'),
	tokenPermission: tokenPermissionsAll,
}

export const balanceOfFor = (
	input: Readonly<{
		token: Token
		amount: number | AmountT
	}>,
): TokenBalance => {
	const amt: AmountT = isAmount(input.amount)
		? input.amount
		: Amount.fromUInt256({
				magnitude: input.token.granularity.magnitude.multiply(
					UInt256.valueOf(input.amount),
				),
				denomination: Denomination.Atto,
		  })._unsafeUnwrap()

	return {
		token: input.token.rri,
		amount: amt.lessThan(input.token.currentSupply)
			? amt
			: input.token.currentSupply,
	}
}

export const balancesFor = (
	address: AddressT,
	amount: number,
): TokenBalances => {
	return {
		owner: address,
		tokenBalances: [
			balanceOfFor({
				token: xrd,
				amount,
			}),
		],
	}
}

const differentTokens: Token[] = [
	xrd,
	fooToken,
	barToken,
	radixWrappedBitcoinToken,
	radixWrappedEtherToken,
	goldToken,
]

// PLEASE KEEP - used as Cast of characters: https://en.wikipedia.org/wiki/Alice_and_Bob#Cast_of_characters
export const alice = toAddress(
	'9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT',
)
export const bob = toAddress(
	'9S9LHeQNFpNJYqLtTJeAbos1LCC5Q7HBiGwPf2oju3NRq5MBKAGt',
)
export const carol = toAddress(
	'9S8sKfN3wGyJdfyu9RwWvGKtZqq3R1NaxwT63VXi5dEZ6dUJXLyR',
)
export const dan = toAddress(
	'9SBFdPAkvquf9XX82D2Z9DzL2WdmNQGcrxFUnKpVytpkMjZWD9Rb',
)
export const erin = toAddress(
	'9S8LZFHXHTSJqNQ86ZeGKtFMJtqZbYPtgHWSC4LyYjSbduNRpDNN',
)
export const frank = toAddress(
	'9SBRR1Xa3RRw1M7juwLTHfL1T2Y7XMZJJM6YyJjqddSLGaH2dk9c',
)
export const grace = toAddress(
	'9S9AtsDC1eR6QSLwrTRi2vteWCg2C1VDMySStFaZVRpMrvErXzBV',
)
export const heidi = toAddress(
	'9S9y4d9owF7kuRk7b14VhfwrBxHe3w9ukbAcbnoLtBFvjWhTCXpz',
)
export const ivan = toAddress(
	'9SBRrNSxu6zacM8qyuUpDh4gNqou8QX6QEu53LKVsT4FXjvD77ou',
)
export const judy = toAddress(
	'9S9tQA7v1jSEUTvLk3hTp9fTmWNsA1ppJ3D6dHLxoqnPcYayAmQf',
)
export const klara = toAddress(
	'9S8np84gn7skz8U2Vd7GwkvSMzSksMLqAq7nrpu2hA2a31M2rmfD',
)
export const leonard = toAddress(
	'9S8toEsjy7bLLVYwenrygbEiQDBiSYen4GDEGan5y6nGMXzKT22G',
)
export const mallory = toAddress(
	'9SBZ9kzpXKAQ9oHHZngahVUQrLwU6DssiPbtCj5Qb6cxqxPC6stb',
)
export const niaj = toAddress(
	'9S9X7DFSGTbfiQpSw1Dv9DHK67K1qHtz1Kjwd2uFtty7Yz8dmZbc',
)
export const olivia = toAddress(
	'9S81XtkW3H9XZrmnzWqYSuTFPhWXdRnnpL3XXk7h5XxAM6zMdH7k',
)
export const peggy = toAddress(
	'9SAGS7iVkjLDa2uoqzvybBJZP5RJd6XLzoeSmqur9WWXoKs7hPqz',
)
export const quentin = toAddress(
	'9SB4Hvi9sudHncGXhUhuvUYNWziMYYcXXiDZ6i7fpSvRUDCA3rjg',
)
export const rupert = toAddress(
	'9SAusiPSyX8xJ3gbNJyYUHZaWz1jSYxXoBnWbzMAkcjhug6G3nLd',
)
export const stella = toAddress(
	'9S8PWQF9smUics1sZEo7CrYgKgCkcopvt9HfWJMTrtPyV2rg7RAG',
)
export const ted = toAddress(
	'9SAihkYQDBKvHfhvwEw4QBfx1rpjvta2TvmWibyXixVzX2JHHHWf',
)
export const ursula = toAddress(
	'9SAzQV3ei2g4qcHpvnMSuEGUYREPgcHvQyBNvkHdop18DDyEqpSY',
)
export const victor = toAddress(
	'9S8PQU9jcALCeXW6sXarwHxjKLqCUM4AkiecSMwdjfUWhdPws9tx',
)
export const webdy = toAddress(
	'9S9T39u425jJfAkWRYPPhpBFdkU5f1KWBuMPg7mWnCQ2abAFSnoZ',
)
export const xerxez = toAddress(
	'9SBA2tji3wjuuThohxW37L6vySVuVaUpBFBpq2b7Ey7sKToU2uJp',
)
export const yara = toAddress(
	'9SBaXGCwn8HcyPsbu4ymzNVCXtvogf3vSqnH39ihqt5RyDFq9hsv',
)
export const zelda = toAddress(
	'9SAU2m7yis9iE5u2L44poZ6rYf5JiTAN6GtiRnsBk6JnXoMoAdks',
)

export const castOfCharacters: AddressT[] = [
	alice,
	bob,
	carol,
	dan,
	erin,
	frank,
	grace,
	heidi,
	ivan,
	judy,
	klara,
	leonard,
	mallory,
	niaj,
	olivia,
	peggy,
	quentin,
	rupert,
	stella,
	ted,
	ursula,
	victor,
	webdy,
	xerxez,
	yara,
	zelda,
]

export const tokenByRRIMap: Map<
	ResourceIdentifierT,
	Token
> = differentTokens.reduce((a: Map<ResourceIdentifierT, Token>, b: Token) => {
	return a.set(b.rri, b)
}, new Map<ResourceIdentifierT, Token>())

const detPRNGWithBuffer = (buffer: Buffer): (() => number) => {
	const bufCopy = Buffer.from(buffer)
	let bytes = Buffer.from(buffer)
	return (): number => {
		if (bytes.length === 0) {
			bytes = sha256(bufCopy)
		}
		const lengthToSlice = 2
		const buf = bytes.slice(0, lengthToSlice)
		bytes = bytes.slice(lengthToSlice, bytes.length)
		return Number.parseInt(buf.toString('hex'), 16)
	}
}

const detPRNGWithPubKey = (pubKey: PublicKey): (() => number) => {
	// cannot use first, since it is always 02 or 03
	const bytes = pubKey.asData({ compressed: true }).slice(1, 33)
	return detPRNGWithBuffer(bytes)
}

type BalanceOfTokenWithInfo = Readonly<{
	token: Token
	amount: AmountT
}>

const detRandBalanceOfTokenWithInfo = (
	png: () => number,
): BalanceOfTokenWithInfo[] => {
	const anInt = png
	const availableTokens = [...differentTokens]

	const deterministicRandomToken = (): Token => {
		const tokenCount = availableTokens.length
		const tokenIndex = anInt() % tokenCount
		const token = availableTokens[tokenIndex]
		availableTokens.splice(tokenIndex, 1)
		return token
	}

	const size = Math.max(anInt() % availableTokens.length, 1)

	return Array(size)
		.fill(undefined)
		.map(
			(_): BalanceOfTokenWithInfo => {
				const token = deterministicRandomToken()
				const amtOrZero = anInt() % 10_000
				const amountNum = Math.max(10, amtOrZero)
				const amount = Amount.inSmallestDenomination(
					token.granularity.magnitude.multiply(amountNum),
				)
				return {
					token,
					amount,
				}
			},
		)
}

export const deterministicRandomBalancesForAddress = (
	address: AddressT,
): TokenBalances => {
	const anInt = detPRNGWithPubKey(address.publicKey)

	const tokenBalances = detRandBalanceOfTokenWithInfo(anInt).map((bti) =>
		balanceOfFor(bti),
	)

	return {
		owner: address,
		tokenBalances,
	}
}

export const deterministicRandomUnstakesForAddress = (
	address: AddressT,
): UnstakePositions => {
	const anInt = detPRNGWithPubKey(address.publicKey)
	const size = anInt() % 5
	return Array(size)
		.fill(undefined)
		.map(
			(_, index): UnstakePosition => {
				const detRandomAddress = (): AddressT =>
					castOfCharacters[anInt() % castOfCharacters.length]
				const validator = detRandomAddress()
				const amount = Amount.fromUnsafe(anInt())._unsafeUnwrap()

				const bytesFromIndex = Buffer.allocUnsafe(2)
				bytesFromIndex.writeUInt16BE(index)
				const txIDBuffer = sha256(
					Buffer.concat([
						address.publicKey.asData({ compressed: true }),
						bytesFromIndex,
					]),
				)

				const withdrawalTxID = TransactionIdentifier.create(
					txIDBuffer,
				)._unsafeUnwrap()

				return {
					amount,
					validator,
					epochsUntil: anInt() % 100,
					withdrawalTxID,
				}
			},
		)
}

export const deterministicRandomStakesForAddress = (
	address: AddressT,
): StakePositions => {
	return deterministicRandomUnstakesForAddress(address).map(
		(un): StakePosition => ({
			...un,
		}),
	)
}

export const deterministicRandomTxHistoryWithInput = (
	input: TransactionHistoryRequestInput,
): TransactionHistory => {
	const address = input.address
	const anInt: () => number = detPRNGWithPubKey(address.publicKey)
	const pubKeyBytes = address.publicKey
		.asData({ compressed: true })
		.slice(1, 33)
	const detRandomAddress = (): AddressT =>
		castOfCharacters[anInt() % castOfCharacters.length]

	const tokenAndAmounts = detRandBalanceOfTokenWithInfo(anInt)

	const deterministicRandomExecutedTransactions = (): ExecutedTransaction[] => {
		return Array(input.size)
			.fill(undefined)
			.map(
				(_, index): ExecutedTransaction => {
					const detMakeActionForTx = (): ExecutedAction[] => {
						// mock max 5 actions per tx in history, min 1.
						const actionCount = Math.max(anInt() % 5, 1)
						return Array(actionCount)
							.fill(undefined)
							.map(
								(_, actionIndex): ExecutedAction => {
									const v: number = anInt() % 4 // Transfer, Stake, Unstake, Other
									const actionType: ActionType =
										v === 0
											? ActionType.TOKEN_TRANSFER
											: v === 1
											? ActionType.STAKE_TOKENS
											: v === 2
											? ActionType.UNSTAKE_TOKENS
											: ActionType.OTHER

									let executedAction: ExecutedAction

									const tokenAndAmount = tokenAndAmounts[
										actionIndex % tokenAndAmounts.length
									]!

									switch (actionType) {
										case ActionType.OTHER:
											executedAction = {
												type: ActionType.OTHER,
											}
											break
										case ActionType.STAKE_TOKENS:
											executedAction = {
												type: ActionType.STAKE_TOKENS,
												amount: Amount.fromUnsafe(
													anInt(),
												)._unsafeUnwrap(),
												validator: detRandomAddress(),
											}
											break
										case ActionType.UNSTAKE_TOKENS:
											executedAction = {
												type: ActionType.UNSTAKE_TOKENS,
												amount: Amount.fromUnsafe(
													anInt(),
												)._unsafeUnwrap(),
												validator: detRandomAddress(),
											}
											break
										case ActionType.TOKEN_TRANSFER:
											executedAction = {
												type: ActionType.TOKEN_TRANSFER,
												from: address,
												to: detRandomAddress(),
												amount: tokenAndAmount.amount,
												rri: tokenAndAmount.token.rri,
											}
											break
									}

									return executedAction
								},
							)
					}

					const bytesFromIndex = Buffer.allocUnsafe(2)
					bytesFromIndex.writeUInt16BE(index)
					const txIDBuffer = sha256(
						Buffer.concat([pubKeyBytes, bytesFromIndex]),
					)
					const date = new Date('2020-03-14T15:32:05')
					date.setMonth(index % 12)

					const txID = TransactionIdentifier.create(
						txIDBuffer,
					)._unsafeUnwrap()

					return {
						txID,
						sentAt: date,
						fee: Amount.fromUnsafe(anInt())._unsafeUnwrap(),
						// message?: {
						// 	msg: string
						// 	encryptionScheme: string
						// }
						actions: detMakeActionForTx(),
					}
				},
			)
	}

	const updatedCursor = sha256(
		input.cursor !== undefined ? Buffer.from(input.cursor) : pubKeyBytes,
	).toString('hex')

	return {
		cursor: updatedCursor,
		transactions: deterministicRandomExecutedTransactions(),
	}
}

const deterministicRandomLookupTXUsingHist = (
	txID: TransactionIdentifierT,
): ExecutedTransaction => {
	const seed = sha256(Buffer.from(txID.__hex, 'hex'))
	const addressWithTXIdBytesAsSeed = Address.fromPublicKeyAndMagicByte({
		magicByte: 123,
		publicKey: privateKeyFromBuffer(seed)._unsafeUnwrap().publicKey(),
	})
	const txs = deterministicRandomTxHistoryWithInput({
		size: 1,
		address: addressWithTXIdBytesAsSeed,
	}).transactions
	if (txs.length === 0) {
		throw new Error('Expected at least one tx...')
	}
	return {
		...txs[0],
		txID,
	}
}

export const deterministicRandomBalances = (
	address: AddressT,
): Observable<TokenBalances> =>
	of(deterministicRandomBalancesForAddress(address))

export const deterministicRandomTXHistory = (
	input: TransactionHistoryRequestInput,
): Observable<TransactionHistory> =>
	of(deterministicRandomTxHistoryWithInput(input))

export const deterministicRandomLookupTX = (
	txID: TransactionIdentifierT,
): Observable<ExecutedTransaction> =>
	of(deterministicRandomLookupTXUsingHist(txID))

export const deterministicRandomUnstakesForAddr = (
	address: AddressT,
): Observable<UnstakePositions> =>
	of(deterministicRandomUnstakesForAddress(address))

export const deterministicRandomStakesForAddr = (
	address: AddressT,
): Observable<StakePositions> =>
	of(deterministicRandomStakesForAddress(address))

export const makeThrowingRadixCoreAPI = (nodeUrl?: string): RadixCoreAPI => ({
	node: { url: new URL(nodeUrl ?? 'http://www.example.com') },

	networkId: (): Observable<Magic> =>
		throwError(() => new Error('Not implemented')),

	tokenBalancesForAddress: (_address: AddressT): Observable<TokenBalances> =>
		throwError(() => new Error('Not implemented')),

	lookupTransaction: (
		_txID: TransactionIdentifierT,
	): Observable<ExecutedTransaction> =>
		throwError(() => new Error('Not implemented')),

	validators: (_input: ValidatorsRequestInput): Observable<Validators> =>
		throwError(() => new Error('Not implemented')),

	transactionHistory: (
		_input: TransactionHistoryRequestInput,
	): Observable<TransactionHistory> =>
		throwError(() => new Error('Not implemented')),

	nativeToken: (): Observable<Token> =>
		throwError(() => new Error('Not implemented')),

	tokenInfo: (_rri: ResourceIdentifierT): Observable<Token> =>
		throwError(() => new Error('Not implemented')),

	stakesForAddress: (_address: AddressT): Observable<StakePositions> =>
		throwError(() => new Error('Not implemented')),

	unstakesForAddress: (_address: AddressT): Observable<UnstakePositions> =>
		throwError(() => new Error('Not implemented')),

	transactionStatus: (
		_txID: TransactionIdentifierT,
	): Observable<StatusOfTransaction> =>
		throwError(() => new Error('Not implemented')),

	networkTransactionThroughput: (): Observable<NetworkTransactionThroughput> =>
		throwError(() => new Error('Not implemented')),

	networkTransactionDemand: (): Observable<NetworkTransactionDemand> =>
		throwError(() => new Error('Not implemented')),

	buildTransaction: (
		_transactionIntent: TransactionIntent,
	): Observable<UnsignedTransaction> =>
		throwError(() => new Error('Not implemented')),

	submitSignedTransaction: (
		_signedTransaction: SignedTransaction,
	): Observable<PendingTransaction> =>
		throwError(() => new Error('Not implemented')),
})

export const mockRadixCoreAPI = (
	input?: Readonly<{
		nodeUrl?: string
		magic?: number
	}>,
): RadixCoreAPI => ({
	...makeThrowingRadixCoreAPI(input?.nodeUrl),
	networkId: (): Observable<Magic> => {
		return of(magicFromNumber(input?.magic ?? 123)).pipe(shareReplay(1))
	},
	nativeToken: (): Observable<Token> => of(xrd),
	tokenInfo: (rri: ResourceIdentifierT): Observable<Token> =>
		of(tokenByRRIMap.get(rri) ?? __fallBackAlexToken),
	tokenBalancesForAddress: deterministicRandomBalances,
	transactionStatus: (txID: TransactionIdentifierT) => {
		const prng = detPRNGWithBuffer(Buffer.from(txID.__hex, 'hex'))
		const shouldFail = prng() % 2 > 0

		const response = (status: TransactionStatus) => ({
			txID,
			status,
			failure: status === TransactionStatus.FAILED ? 'Failed' : undefined,
		})

		return (shouldFail
			? of(
					response(TransactionStatus.PENDING),
					response(TransactionStatus.FAILED),
			  )
			: of(
					response(TransactionStatus.PENDING),
					response(TransactionStatus.CONFIRMED),
			  )
		).pipe(delay(1000))
	},
	transactionHistory: deterministicRandomTXHistory,
	lookupTransaction: deterministicRandomLookupTX,
	unstakesForAddress: deterministicRandomUnstakesForAddr,
	stakesForAddress: deterministicRandomStakesForAddr,
})

export const mockedAPI: Observable<RadixCoreAPI> = of(mockRadixCoreAPI())
