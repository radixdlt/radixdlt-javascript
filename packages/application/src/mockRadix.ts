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
import { Observable, of } from 'rxjs'
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
	SimpleTokenBalance,
	SimpleTokenBalances,
	TransactionHistory,
	TransactionHistoryRequestInput,
	TransactionIdentifierT,
	TransactionIntent,
	TransactionStatus,
	BuiltTransaction,
	UnstakePositions,
	Validator,
	Validators,
	ValidatorsRequestInput,
} from './dto/_types'
import { ResourceIdentifier } from './dto/resourceIdentifier'
import { tokenOwnerOnly, tokenPermissionsAll } from './dto/tokenPermissions'
import { RadixCoreAPI } from './api/_types'
import { delay, shareReplay } from 'rxjs/operators'
import { privateKeyFromBuffer, PublicKey, sha256 } from '@radixdlt/crypto'
import { ActionType, ExecutedAction } from './actions/_types'
import { TransactionIdentifier } from './dto/transactionIdentifier'
import { StakePosition, UnstakePosition } from './dto/_types'
import { SubmittedTransaction } from './dto/_types'
import { isNumber } from '@radixdlt/util'

export const toAddress = (b58: string): AddressT =>
	Address.fromBase58String(b58)._unsafeUnwrap()

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
): SimpleTokenBalance => {
	const amt: AmountT = isAmount(input.amount)
		? input.amount
		: Amount.fromUInt256({
				magnitude: input.token.granularity.magnitude.multiply(
					isNumber(input.amount)
						? UInt256.valueOf(input.amount)
						: input.amount.magnitude,
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
): SimpleTokenBalances => {
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

const characterNames: string[] = [
	'alice',
	'bob',
	'carol',
	'dan',
	'erin',
	'frank',
	'grace',
	'heidi',
	'ivan',
	'judy',
	'klara',
	'leonard',
	'mallory',
	'niaj',
	'olivia',
	'peggy',
	'quentin',
	'rupert',
	'stella',
	'ted',
	'ursula',
	'victor',
	'webdy',
	'xerxez',
	'yara',
	'zelda',
]

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

const randomValidatorList = (size: number) => {
	const validatorList: Validator[] = []
	const prng = detPRNGWithBuffer(Buffer.from('validators'))
	const listSize = prng() % 5 === 1 ? size - Math.round(size / 2) : size

	for (let i = 0; i < listSize; i++) {
		const random = prng()
		const address = castOfCharacters[random % castOfCharacters.length]
		const ownerAddress =
			castOfCharacters[(random + 1) % castOfCharacters.length]
		const name = characterNames[random % characterNames.length]
		const amount = Amount.fromUnsafe(random)._unsafeUnwrap()
		const bool = random % 2 === 0

		validatorList.push({
			address,
			ownerAddress,
			name,
			infoURL: new URL('https://example.com'),
			totalDelegatedStake: amount,
			ownerDelegation: amount,
			isExternalStakeAccepted: bool,
		})
	}
	return validatorList
}

const randomUnsignedTransaction = (
	transactionIntent: TransactionIntent,
): BuiltTransaction => {
	const transactionIntentDet = {
		...transactionIntent,
		actions: transactionIntent.actions.map((a) => ({
			...a,
			uuid: 'deadbeef',
		})),
	}

	const detBlob = JSON.stringify(transactionIntentDet, null, 4)
	const blobBytes = Buffer.from(detBlob)
	const bytes32 = sha256(blobBytes)

	const anInt = detPRNGWithBuffer(bytes32)

	return {
		transaction: {
			blob: blobBytes.toString('hex'),
			hashOfBlobToSign: bytes32.toString('hex'),
		},
		fee: Amount.fromUnsafe(anInt())._unsafeUnwrap(),
	}
}

const randomPendingTransaction = (
	signedTx: SignedTransaction,
): PendingTransaction => ({
	txID: TransactionIdentifier.create(
		sha256(Buffer.from(signedTx.transaction.blob)),
	)._unsafeUnwrap(),
})

const detRandomSignedUnconfirmedTransaction = (
	signedTransaction: SignedTransaction,
): SubmittedTransaction => {
	const txID = randomPendingTransaction(signedTransaction).txID
	return {
		...signedTransaction,
		txID,
	}
}

const rndDemand = detPRNGWithBuffer(Buffer.from('dmnd'))
const randomDemand = (): NetworkTransactionDemand => ({
	tps: rndDemand() % 200,
})

const rndThroughput = detPRNGWithBuffer(Buffer.from('trpt'))
const randomThroughput = (): NetworkTransactionDemand => ({
	tps: rndThroughput() % 200,
})

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
): SimpleTokenBalances => {
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
	const size = anInt() % 10
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

				const epochsUntil = anInt() % 100
				return {
					amount,
					validator,
					epochsUntil: epochsUntil > 70 ? 0 : epochsUntil,
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
): Observable<SimpleTokenBalances> =>
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

	networkId: (): Observable<Magic> => {
		throw Error('Not implemented')
	},

	tokenBalancesForAddress: (
		_address: AddressT,
	): Observable<SimpleTokenBalances> => {
		throw Error('Not implemented')
	},

	lookupTransaction: (
		_txID: TransactionIdentifierT,
	): Observable<ExecutedTransaction> => {
		throw Error('Not implemented')
	},

	validators: (_input: ValidatorsRequestInput): Observable<Validators> => {
		throw Error('Not implemented')
	},

	transactionHistory: (
		_input: TransactionHistoryRequestInput,
	): Observable<TransactionHistory> => {
		throw Error('Not implemented')
	},

	nativeToken: (): Observable<Token> => {
		throw Error('Not implemented')
	},

	tokenInfo: (_rri: ResourceIdentifierT): Observable<Token> => {
		throw Error('Not implemented')
	},

	stakesForAddress: (_address: AddressT): Observable<StakePositions> => {
		throw Error('Not implemented')
	},

	unstakesForAddress: (_address: AddressT): Observable<UnstakePositions> => {
		throw Error('Not implemented')
	},

	transactionStatus: (
		_txID: TransactionIdentifierT,
	): Observable<StatusOfTransaction> => {
		throw Error('Not implemented')
	},

	networkTransactionThroughput: (): Observable<NetworkTransactionThroughput> => {
		throw Error('Not implemented')
	},

	networkTransactionDemand: (): Observable<NetworkTransactionDemand> => {
		throw Error('Not implemented')
	},

	buildTransaction: (
		_transactionIntent: TransactionIntent,
	): Observable<BuiltTransaction> => {
		throw Error('Not implemented')
	},

	submitSignedTransaction: (
		_signedTransaction: SignedTransaction,
	): Observable<SubmittedTransaction> => {
		throw Error('Not implemented')
	},

	finalizeTransaction: (
		_signedUnconfirmedTransaction: SubmittedTransaction,
	): Observable<PendingTransaction> => {
		throw Error('Not implemented')
	},
})

let txStatusMapCounter: Map<
	TransactionIdentifierT,
	number
> = (undefined as unknown) as Map<TransactionIdentifierT, number>

export const mockRadixCoreAPI = (
	input?: Readonly<{
		nodeUrl?: string
		magic?: number
	}>,
): RadixCoreAPI => {
	txStatusMapCounter = new Map<TransactionIdentifierT, number>()
	return {
		node: { url: new URL(input?.nodeUrl ?? 'http://www.example.com') },

		networkId: (): Observable<Magic> => {
			return of(magicFromNumber(input?.magic ?? 123)).pipe(shareReplay(1))
		},
		nativeToken: (): Observable<Token> => of(xrd),
		tokenInfo: (rri: ResourceIdentifierT): Observable<Token> =>
			of(tokenByRRIMap.get(rri) ?? __fallBackAlexToken),
		tokenBalancesForAddress: deterministicRandomBalances,
		transactionStatus: (
			txID: TransactionIdentifierT,
		): Observable<StatusOfTransaction> => {
			const last = txStatusMapCounter.get(txID) ?? 0
			const incremented = last + 1
			txStatusMapCounter.set(txID, incremented)

			const status: TransactionStatus =
				last <= 1
					? TransactionStatus.PENDING
					: TransactionStatus.CONFIRMED

			return of({
				txID,
				status, // when TransactionStatus.FAIL ?
			}).pipe(delay(50))
		},
		validators: (input: ValidatorsRequestInput): Observable<Validators> =>
			of(randomValidatorList(input.size)),
		buildTransaction: (
			transactionIntent: TransactionIntent,
		): Observable<BuiltTransaction> =>
			of(randomUnsignedTransaction(transactionIntent)).pipe(delay(50)),
		submitSignedTransaction: (
			signedTransaction: SignedTransaction,
		): Observable<SubmittedTransaction> =>
			of(detRandomSignedUnconfirmedTransaction(signedTransaction)).pipe(
				delay(50),
			),
		finalizeTransaction: (signedUnconfirmedTX) =>
			of(randomPendingTransaction(signedUnconfirmedTX)).pipe(delay(50)),
		networkTransactionDemand: (): Observable<NetworkTransactionDemand> =>
			of(randomDemand()),
		networkTransactionThroughput: (): Observable<NetworkTransactionThroughput> =>
			of(randomThroughput()),
		transactionHistory: deterministicRandomTXHistory,
		lookupTransaction: deterministicRandomLookupTX,
		unstakesForAddress: deterministicRandomUnstakesForAddr,
		stakesForAddress: deterministicRandomStakesForAddr,
	}
}

export const mockedAPI: Observable<RadixCoreAPI> = of(mockRadixCoreAPI())
