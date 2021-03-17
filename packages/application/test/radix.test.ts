import {
	SubmittedAtomResponse,
	AtomFromTransactionResponse,
	NetworkTransactionDemand,
	NetworkTransactionThroughput,
	NodeT,
	RadixCoreAPI,
	Token,
	RadixT,
	TokenBalances,
	ExecutedTransactions,
	Transaction,
	TokenFeeForTransaction,
	Stakes,
	TransactionStatus,
	SignedAtom,
} from '../src/_types'
import { Radix } from '../src/radix'
import { AddressT, HDMasterSeed, Wallet, WalletT } from '@radixdlt/account'
import { Observable, of, throwError } from 'rxjs'
import { Amount, Magic, magicFromNumber, maxAmount } from '@radixdlt/primitives'
import { map, take, toArray } from 'rxjs/operators'
import {
	AtomIdentifierT,
	ResourceIdentifier,
	tokenPermissionsAll,
} from '@radixdlt/atom'
import { UInt256 } from '@radixdlt/uint256'

const createWallet = (): WalletT => {
	const masterSeed = HDMasterSeed.fromSeed(
		Buffer.from('deadbeef'.repeat(8), 'hex'),
	)
	return Wallet.create({ masterSeed })
}

const dummyNode = (urlString: string): Observable<NodeT> =>
	of({
		url: new URL(urlString),
	})

const xrd: Token = {
	name: 'Rad',
	rri: ResourceIdentifier.fromString(
		'/9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT/XRD',
	)._unsafeUnwrap(),
	symbol: 'XRD',
	description: 'The native coin of Radix network',
	granularity: Amount.inSmallestDenomination(UInt256.valueOf(1)),
	isSupplyMutable: false,
	currentSupply: maxAmount,
	tokenInfoURL: new URL('http://www.radixdlt.com'),
	iconURL: new URL('http://www.image.radixdlt.com/'),
	tokenPermission: tokenPermissionsAll,
}

const crashingAPI: RadixCoreAPI = {
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

const mockAPI = (urlString?: string): Observable<RadixCoreAPI> => {
	const mockedPartialAPI = {
		...crashingAPI,
		node: { url: new URL(urlString ?? 'http://www.example.com') },
		magic: (): Observable<Magic> => of(magicFromNumber(123)),
		nativeToken: (): Observable<Token> => of(xrd),
	}
	return of(mockedPartialAPI)
}

describe('Radix API', () => {
	it('can be created empty', () => {
		const radix = Radix.create()
		expect(radix).toBeDefined()
	})

	it('emits node connection without wallet', async (done) => {
		const radix = Radix.create()
		radix._withAPI(mockAPI())

		radix.observeNode().subscribe(
			(node) => {
				expect(node.url.host).toBe('www.example.com')
				done()
			},
			(error) => done(error),
		)
	})

	const testChangeNode = async (
		expectedValues: string[],
		done: jest.DoneCallback,
		emitNewValues: (radix: RadixT) => void,
	): Promise<void> => {
		const radix = Radix.create()

		radix
			.observeNode()
			.pipe(
				map((n: NodeT) => n.url.toString()),
				take(2),
				toArray(),
			)
			.subscribe(
				(nodes) => {
					expect(nodes).toStrictEqual(expectedValues)
					done()
				},
				(error) => done(error),
			)

		emitNewValues(radix)
	}

	it('can change node', async (done) => {
		const n1 = 'http://www.node1.com/'
		const n2 = 'http://www.node2.com/'

		await testChangeNode([n1, n2], done, (radix: RadixT) => {
			radix.withAPIAtNode(dummyNode(n1))
			radix.withAPIAtNode(dummyNode(n2))
		})
	})

	it('can change api', async (done) => {
		const n1 = 'http://www.node1.com/'
		const n2 = 'http://www.node2.com/'

		await testChangeNode([n1, n2], done, (radix: RadixT) => {
			radix._withAPI(mockAPI(n1))
			radix._withAPI(mockAPI(n2))
		})
	})

	it('can observe active account without API', async (done) => {
		const radix = Radix.create()
		const wallet = createWallet()
		radix.withWallet(wallet)

		radix.observeActiveAccount().subscribe(
			(account) => {
				expect(account.hdPath.addressIndex.value()).toBe(0)
				done()
			},
			(error) => done(error),
		)
	})

	it('provides magic for wallets', async (done) => {
		const radix = Radix.create()
		const wallet = createWallet()
		radix.withWallet(wallet)
		radix._withAPI(mockAPI())

		radix.observeActiveAddress().subscribe(
			(address) => {
				expect(address.magicByte).toBe(123)
				done()
			},
			(error) => done(error),
		)
	})

	it('returns native token without wallet', async (done) => {
		const radix = Radix.create()
		radix._withAPI(mockAPI())

		radix.nativeToken().subscribe(
			(token) => {
				expect(token.symbol).toBe('XRD')
				done()
			},
			(error) => done(error),
		)
	})
})
