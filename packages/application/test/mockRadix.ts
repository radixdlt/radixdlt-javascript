import {
	Amount,
	Denomination,
	Magic,
	magicFromNumber,
	maxAmount,
} from '@radixdlt/primitives'
import { UInt256 } from '@radixdlt/uint256'
import { AddressT } from '@radixdlt/account'
import { Observable, of, throwError } from 'rxjs'
import {
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
	TransactionIdentifierT,
	TransactionIntent,
	TransactionStatus,
	UnsignedTransaction,
	UnstakePositions,
} from '../src/dto/_types'
import { ResourceIdentifier } from '../src/dto/resourceIdentifier'
import { tokenPermissionsAll } from '../src/dto/tokenPermissions'
import { RadixCoreAPI } from '../src/api/_types'
import {
	ExecutedTransaction,
	TransactionHistoryRequestInput,
	Validators,
	ValidatorsRequestInput,
} from '../src/dto/_types'
import { delay, shareReplay } from 'rxjs/operators'
import { tokenOwnerOnly } from '../dist/dto/tokenPermissions'

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
		amount: number
	}>,
): TokenBalance => {
	if (!Number.isInteger(input.amount) || input.amount < 1)
		throw new Error('Must be interger >= 1')

	const amt = Amount.fromUInt256({
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

export const tokenByRRIMap: Map<
	ResourceIdentifierT,
	Token
> = differentTokens.reduce((a: Map<ResourceIdentifierT, Token>, b: Token) => {
	return a.set(b.rri, b)
}, new Map<ResourceIdentifierT, Token>())

export const deterministicRandomBalancesForAddress = (
	address: AddressT,
): TokenBalances => {
	// cannot use first, since it is always 02 or 03
	let bytes = address.publicKey.asData({ compressed: true }).slice(1, 33)

	const anInt = (): number => {
		if (bytes.length === 0) {
			throw new Error('Failed to create randomness for mocked data.')
		}
		const lengthToSlice = 2
		const buf = bytes.slice(0, lengthToSlice)
		bytes = bytes.slice(lengthToSlice, bytes.length)
		return Number.parseInt(buf.toString('hex'), 16)
	}

	const deterministicTokenBalances = (): TokenBalance[] => {
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
				(_): TokenBalance => {
					const amtOrZero = anInt() % 10_000
					const amount = Math.max(10, amtOrZero)

					return balanceOfFor({
						token: deterministicRandomToken(),
						amount,
					})
				},
			)
	}

	return {
		owner: address,
		tokenBalances: deterministicTokenBalances(),
	}
}

export const deterministicRandomBalances = (
	address: AddressT,
): Observable<TokenBalances> =>
	of(deterministicRandomBalancesForAddress(address))

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
		const shouldFail = Math.round(Math.random()) > 0.5 ? true : false

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
})

export const mockedAPI: Observable<RadixCoreAPI> = of(mockRadixCoreAPI())
