import { Radix } from '../src/radix'
import {
	AddressT,
	HDMasterSeed,
	Mnemonic,
	Wallet,
	WalletT,
} from '@radixdlt/account'
import { Observable, of, throwError } from 'rxjs'
import { NodeT, RadixCoreAPI, Token, TokenBalances } from '../src/_types'
import { Magic, magicFromNumber } from '@radixdlt/primitives'
import { map, take, toArray } from 'rxjs/operators'
import { RadixT } from '../dist/_types'

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

const mockAPI = (urlString?: string): Observable<RadixCoreAPI> => {
	const mockedAPI: RadixCoreAPI = {
		node: { url: new URL(urlString ?? 'http://www.example.com') },
		magic: (): Observable<Magic> => of(magicFromNumber(123)),
		nativeToken: (): Observable<Token> => of('TokenDefinition'),
		tokenBalances: (address: AddressT): Observable<TokenBalances> =>
			throwError(() => new Error('impl me')),
	}
	return of(mockedAPI)
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
				expect(token).toBe('TokenDefinition')
				done()
			},
			(error) => done(error),
		)
	})
})
