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
import {
	Address,
	AddressT,
	ValidatorAddress,
	ValidatorAddressT,
} from '@radixdlt/account'
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
import { shareReplay } from 'rxjs/operators'
import {
	privateKeyFromBuffer,
	privateKeyFromHex,
	PublicKey,
	sha256,
} from '@radixdlt/crypto'
import { ActionType, ExecutedAction } from './actions/_types'
import { TransactionIdentifier } from './dto/transactionIdentifier'
import { StakePosition, UnstakePosition } from './dto/_types'
import { FinalizedTransaction } from './dto/_types'
import { isNumber } from '@radixdlt/util'

export const toAddress = (b58: string): AddressT =>
	Address.fromBase58String(b58)._unsafeUnwrap()

export const xrd: Token = {
	name: 'Rad',
	rri: ResourceIdentifier.fromBech32String(
		'xrd_rr1qfumuen7l8wthtz45p3ftn58pvrs9xlumvkuu2xet8egzkcklqtesv2yq5l',
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
		tokenIdentifier: input.token.rri,
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

const makeListOfValidatorAddresses = (): ValidatorAddressT[] => {
	const stringAddresses = [
		'vb1qgfqnj34dn7qp9wvf4l6rhw6hu3l82rcqh3rjtk080t75t888u98wkh3gjq',
		'vb1q2hjzctnunty0g2e39qpg7mawkmv4k4ep733p7khxdzdjfkmlfhp2phu80q',
		'vb1qv8yvu0266mj996nqdk5skj7r88udjx4wpsagg7x64fsggs0s9hz5f8wtld',
		'vb1qgppq78aq420903ndag4un4mccuskzl0fmv7nx5xpnrjq43ry6rtw26mqek',
		'vb1qdyekkzm7n5h4yppdaw9hl3rzjc29vtul4ptm0agskjw5esuqy77usz5vm2',
		'vb1q2p582qlnwjq42d8xrxqdah2kutds0f3tyfnnkqanjyyn742rzl35t7wy52',
		'vb1qw59u3e0l5zh52rlnuf3gdche8rtaclq75u03lr6rga6hyrxfytngr64v62',
		'vb1q0qdqu93fj35qvdtfz96wetce04x4q84qk6v5p06nz9axah294rfzc9xqsu',
		'vb1q2j4298q80yxs4nnx7uc6ats3jmtmpxc2d8ae3n6rhkeakd2chrgzt6dje8',
		'vb1qw2kkxsp2uga40hmfr405s4khx2k0etw4vttlvhaqa0vqaragvaegmeu7ml',
		'vb1qvzzmu6c23hsa286ujmlydzclzpq9uuxm0qevf4yzr0xgu3cc5q86zjt4rw',
		'vb1qfdvz6frcf65y2x7xtdsw2865atjzn8phgf3f05mdsxcx2zkryv6v42ya23',
		'vb1q2y8deq8tqn5en37jcaxfyap4e20je448v87yttuzzvlztcylud46s2zhs9',
		'vb1q2hs5wdeaq7sf6u6s7d7fchnlp8wmgm4ns7mzqyje58dlmt3mvyfkq73y9h',
		'vb1qtqhujwqnly3xnkr8pjgmlupnnswwuxpc982enzwqcf7l9c06ghqy2veqmp',
		'vb1q2wqas50dev0w78tzh06pghkvmjcakqhlwru6stawjwcvf20t8srymp07e7',
		'vb1qwqsxvvd0djcvnnfkxu3p0jdq0wejvd3ndz56ucr0j69ahqj0gjlv2x7zc9',
		'vb1qdwz0sgu94n6dpmltg3fye6gmldg8zd8u4rmwzp7f7sce3qzu2k769ff3f2',
		'vb1qdpmnqtzkuqp857j9h65mh3zr8cwjwhtezas69featrqt72z0mfysrn6w4q',
		'vb1qw7cg95sjccyjrc9hsm0hp6nmxxxqffcqyk98q9yvfg8kqdjav4kquahme3',
		'vb1q2u3asfddcyhqu5r444rmk6u2v4nzrx8urqa8rpnkg68krulwqyd5mpd4t7',
		'vb1qfd68uzg9pnxuvps75ps2739ay3g6ljjygvnjq5gz5e48x3z9f5ekum9ete',
		'vb1q222920dw34vmm7z2je3l7z2npdfujrd2zzf3aplzmwsqfsasrth5xwadth',
		'vb1qdy58u6hec2dfcjl6u8e9pnz07dtzpxym58rw8a4sa2c30mxxlyvwy8rp4t',
		'vb1q2dv2vts2xgtcm0rqakpjv7sztxk2q0tmwqt54h434da0fuv9yg5v4w2yu8',
		'vb1qtgu78y7cq04m3r82kzyfwr8669ax62wg0n0ddj62tvnfklms7flxtlvxqy',
		'vb1qthrved6r0s2609k6lw55n8yl7vq709zx72uunawuy96le6z5xxxx94kt0c',
		'vb1qvvjydy0gqt9wu32h8drm2ly4sjtcav0tt9nhnwvyjhgwtekmp37w06tegw',
		'vb1qtjskjnzmdaa4k7s209l530cuc2smwpdt7ndf9dalueard3p90gpxjmyqen',
		'vb1qtqtksw26jcqqzqaa59955jhxn4asw7hlzl92q66fj7fr0tf8sq85327ull',
		'vb1q0yjnqs8adkqk3w2zzvqpq8qc2ejvz8tsxh9vejvg3d3np26atk25w24qdm',
		'vb1qf8660tsghyxu5p9sfyul9urvemag8laktknxu3lyrqld566gh02ghrsdum',
		'vb1q0w8dh43evpkw29t24aj98akzl6qeq3za7rx568grvz3kw0nchh520tyznw',
		'vb1q20g62apnpwvz3cf86v5adc5ukvkm8x5qaf4wc04wjxhwpddruu7609wrs4',
		'vb1qw2dwpmw8vg5qzg5m0htkl7gfjrc630xn4cuwn65n29k58skjl9hx8uqw3a',
		'vb1qfcsanpjz4rs9kefaj2dzrrrt97l0lddxek2yp6nnu56sljuwgdpujwtadd',
		'vb1q0l89534zvsddk0ww92963hgnjzx5h4lse2mx5q09psc96c4gga62uzlwwk',
		'vb1qwseqk8cpcprf6g39uw7xjns5kua46hy4w0ekxa0tn99dmc4uu7wg5dc0mc',
		'vb1qdspy3d6n54yg7jth6fg696zpkftnsz6vs6tn533glf4gz4kardrsa0e9gj',
		'vb1qd7zm8a7jcya5qgua6nwphe64338rrk9vzhgg6ddkcsq0r40emjmqm5ynd3',
		'vb1q0jqfcyyxf4a6jl00v27r4hwhcrerq7qnx93p8fglqgfsf5ykt30qgthv6t',
		'vb1qv9yf9emtcfwvdmms0zwxjjkevr3dawmwlvnhld2346ylr3g8ldmzx56a70',
		'vb1qg9l7vdfx430n2p0qktuxh8nv4anhvhjlqzd8yecn6krnx7jqqq7jyv2vjz',
	]

	return stringAddresses.map((s) =>
		ValidatorAddress.fromUnsafe(s)._unsafeUnwrap({ withStackTrace: true }),
	)
}

const listOfValidatorAddresses: ValidatorAddressT[] = makeListOfValidatorAddresses()

const detRandomValidatorAddressWithPRNG = (
	anInt: () => number,
) => (): ValidatorAddressT => {
	const randomInt = anInt()
	const index = randomInt % (listOfValidatorAddresses.length - 1)
	return listOfValidatorAddresses[index]
}

const randomValidatorList = (
	size: number,
	validatorAddress?: ValidatorAddressT,
): Validator[] => {
	const validatorList: Validator[] = []
	const randomBuf =
		validatorAddress !== undefined
			? sha256(validatorAddress.toString())
			: sha256(size.toString(16))
	const prng = detPRNGWithBuffer(randomBuf)

	const detRandomValidatorAddress = detRandomValidatorAddressWithPRNG(prng)

	const listSize = prng() % 5 === 1 ? size - Math.round(size / 2) : size

	for (let i = 0; i < listSize; i++) {
		const random = prng()
		const ownerAddress = castOfCharacters[random % castOfCharacters.length]
		const name = characterNames[random % characterNames.length]
		const amount = Amount.fromUnsafe(random)._unsafeUnwrap()
		const bool = random % 2 === 0

		validatorList.push({
			address: detRandomValidatorAddress(),
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
): FinalizedTransaction => {
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
				const detRandomValidatorAddress = detRandomValidatorAddressWithPRNG(
					anInt,
				)

				const validator: ValidatorAddressT = detRandomValidatorAddress()
				const amount = Amount.fromUnsafe(anInt())._unsafeUnwrap()

				const bytesFromIndex = Buffer.allocUnsafe(2)
				bytesFromIndex.writeUInt16BE(index)
				const txIDBuffer = sha256(
					Buffer.concat([
						address.publicKey.asData({ compressed: true }),
						bytesFromIndex,
					]),
				)

				const withdrawTxID = TransactionIdentifier.create(
					txIDBuffer,
				)._unsafeUnwrap()

				const epochsUntil = anInt() % 100
				return {
					amount,
					validator,
					epochsUntil: epochsUntil > 70 ? 0 : epochsUntil,
					withdrawTxID,
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
	const detRandomValidatorAddress = detRandomValidatorAddressWithPRNG(anInt)
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
												from: address,
												amount: Amount.fromUnsafe(
													anInt(),
												)._unsafeUnwrap(),
												validator: detRandomValidatorAddress(),
											}
											break
										case ActionType.UNSTAKE_TOKENS:
											executedAction = {
												type: ActionType.UNSTAKE_TOKENS,
												from: address,
												amount: Amount.fromUnsafe(
													anInt(),
												)._unsafeUnwrap(),
												validator: detRandomValidatorAddress(),
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

	lookupValidator: (_input: ValidatorAddressT): Observable<Validator> => {
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
		_signedTransaction: FinalizedTransaction,
	): Observable<FinalizedTransaction> => {
		throw Error('Not implemented')
	},

	finalizeTransaction: (
		_signedUnconfirmedTransaction: SignedTransaction,
	): Observable<FinalizedTransaction> => {
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
			})
		},
		validators: (input: ValidatorsRequestInput): Observable<Validators> =>
			of({
				cursor: 'cursor',
				validators: randomValidatorList(input.size),
			}),
		lookupValidator: (
			validatorAddress: ValidatorAddressT,
		): Observable<Validator> => {
			const validatorRnd = randomValidatorList(1, validatorAddress)[0]
			const validator: Validator = {
				...validatorRnd,
				address: validatorAddress,
			}
			return of(validator)
		},
		buildTransaction: (
			transactionIntent: TransactionIntent,
		): Observable<BuiltTransaction> =>
			of(randomUnsignedTransaction(transactionIntent)),
		finalizeTransaction: (
			signedTransaction: SignedTransaction,
		): Observable<FinalizedTransaction> =>
			of(detRandomSignedUnconfirmedTransaction(signedTransaction)),
		submitSignedTransaction: (signedUnconfirmedTX) =>
			of(randomPendingTransaction(signedUnconfirmedTX)),
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
