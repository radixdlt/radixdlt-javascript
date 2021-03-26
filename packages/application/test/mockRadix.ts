import {
	AtomFromTransactionResponse,
	ExecutedTransactions,
	NetworkTransactionDemand,
	NetworkTransactionThroughput,
	RadixCoreAPI,
	SignedAtom,
	Stakes,
	SubmittedAtomResponse,
	Token,
	TokenBalances,
	TokenFeeForTransaction,
	Transaction,
	TransactionStatus,
} from '../src/api/_types'
import {
	AtomIdentifierT,
	ResourceIdentifier,
	tokenPermissionsAll,
} from '@radixdlt/atom'
import {
	Amount,
	Denomination,
	Magic,
	magicFromNumber,
	maxAmount,
} from '@radixdlt/primitives'
import { UInt256 } from '@radixdlt/uint256'
import { TokenBalance } from '../src/api/json-rpc/_types'
import { AddressT } from '@radixdlt/account'
import { Observable, of, throwError } from 'rxjs'

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

export const radixWrappedBitcoinToken: Token = {
	name: 'Bitcoin (wrapped on Radix)',
	rri: ResourceIdentifier.fromString(
		'/9SBaXGCwn8HcyPsbu4ymzNVCXtvogf3vSqnH39ihqt5RyDFq9hsv/BTCRW',
	)._unsafeUnwrap(),
	symbol: 'rwBTC',
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
	symbol: 'rwETH',
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

	const differentTokens: Token[] = [
		xrd,
		fooToken,
		barToken,
		radixWrappedBitcoinToken,
		radixWrappedEtherToken,
	]

	const deterministicRandomToken = (): Token => {
		const tokenCount = differentTokens.length
		const tokenIndex = anInt() % tokenCount
		const token = differentTokens[tokenIndex]
		differentTokens.splice(tokenIndex, 1)
		return token
	}

	const deterministicTokenBalances = (): TokenBalance[] => {
		const sizeOrZero = anInt() % differentTokens.length
		const size = Math.max(sizeOrZero, 1)
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

export const crashingAPI: RadixCoreAPI = {
	node: { url: new URL('http://www.not.implemented.com') },

	magic: (): Observable<Magic> =>
		throwError(() => new Error('Not implemented')),

	tokenBalancesForAddress: (_address: AddressT): Observable<TokenBalances> =>
		throwError(() => new Error('Not implemented')),

	executedTransactions: (
		_input: Readonly<{
			address: AddressT
			// pagination
			size: number
		}>,
	): Observable<ExecutedTransactions> =>
		throwError(() => new Error('Not implemented')),

	nativeToken: (): Observable<Token> =>
		throwError(() => new Error('Not implemented')),

	tokenFeeForTransaction: (
		_transaction: Transaction,
	): Observable<TokenFeeForTransaction> =>
		throwError(() => new Error('Not implemented')),

	stakesForAddress: (_address: AddressT): Observable<Stakes> =>
		throwError(() => new Error('Not implemented')),

	transactionStatus: (
		_atomIdentifier: AtomIdentifierT,
	): Observable<TransactionStatus> =>
		throwError(() => new Error('Not implemented')),

	networkTransactionThroughput: (): Observable<NetworkTransactionThroughput> =>
		throwError(() => new Error('Not implemented')),

	networkTransactionDemand: (): Observable<NetworkTransactionDemand> =>
		throwError(() => new Error('Not implemented')),

	getAtomForTransaction: (
		_transaction: Transaction,
	): Observable<AtomFromTransactionResponse> =>
		throwError(() => new Error('Not implemented')),

	submitSignedAtom: (
		_signedAtom: SignedAtom,
	): Observable<SubmittedAtomResponse> =>
		throwError(() => new Error('Not implemented')),
}

export const mockedAPI: Observable<RadixCoreAPI> = of({
	...crashingAPI,
	magic: (): Observable<Magic> => of(magicFromNumber(123)),
	nativeToken: (): Observable<Token> => of(xrd),
	tokenBalancesForAddress: deterministicRandomBalances,
})
