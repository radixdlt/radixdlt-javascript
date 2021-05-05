import { AmountOrUnsafeInput, AmountT, uint256Max } from '@radixdlt/primitives'
import {
	Acc0untAddress,
	Acc0untAddressT,
	NetworkT,
	ResourceIdentifier,
	ResourceIdentifierT,
	ValidatorAddress,
	ValidatorAddressT,
} from '@radixdlt/account'
import { Observable, of } from 'rxjs'
import {
	BuiltTransaction,
	ExecutedTransaction,
	FinalizedTransaction,
	NetworkTransactionDemand,
	NetworkTransactionThroughput,
	PendingTransaction,
	SignedTransaction,
	SimpleExecutedTransaction,
	SimpleTokenBalance,
	SimpleTokenBalances,
	StakePosition,
	StakePositions,
	StatusOfTransaction,
	Token,
	TransactionHistory,
	TransactionHistoryRequestInput,
	TransactionIdentifierT,
	TransactionIntent,
	TransactionStatus,
	TransactionType,
	UnstakePosition,
	UnstakePositions,
	Validator,
	Validators,
	ValidatorsRequestInput,
} from './dto/_types'
import { TransactionIdentifier } from './dto'
import { RadixCoreAPI } from './api'
import { shareReplay } from 'rxjs/operators'
import { privateKeyFromBuffer, PublicKey, sha256 } from '@radixdlt/crypto'
import { ActionType, ExecutedAction } from './actions'
import { Amount } from '@radixdlt/primitives'

export const xrd: Token = {
	name: 'Rad',
	rri: ResourceIdentifier.fromUnsafe('xrd_rb1qya85pwq')._unsafeUnwrap(),
	symbol: 'XRD',
	description: 'The native coin of Radix network',
	granularity: Amount.fromUnsafe(1)._unsafeUnwrap(),
	isSupplyMutable: false,
	currentSupply: uint256Max,
	tokenInfoURL: new URL('https://www.radixdlt.com'),
	iconURL: new URL('https://www.image.radixdlt.com/'),
}

export const fooToken: Token = {
	name: 'Foo token',
	rri: ResourceIdentifier.fromUnsafe('foo_rb1qy3q706k')._unsafeUnwrap(),
	symbol: 'FOO',
	description: 'FOOest token.',
	granularity: Amount.fromUnsafe(1)._unsafeUnwrap(),
	isSupplyMutable: false,
	currentSupply: uint256Max,
	tokenInfoURL: new URL('https://www.footoken.com'),
	iconURL: new URL('https://www.image.footoken.com/'),
}

export const barToken: Token = {
	name: 'Bar token',
	rri: ResourceIdentifier.fromUnsafe('bar_rb1qy6gq5vc')._unsafeUnwrap(),
	symbol: 'BAR',
	description: 'Bar token. Granularity E-3.',
	granularity: Amount.fromUnsafe(1000)._unsafeUnwrap(),
	isSupplyMutable: true,
	currentSupply: uint256Max,
	tokenInfoURL: new URL('https://www.bartoken.com'),
	iconURL: new URL('https://www.image.bartoken.com/'),
}

export const goldToken: Token = {
	name: 'Gold token',
	rri: ResourceIdentifier.fromUnsafe('gold_rb1qydtpdac')._unsafeUnwrap(),
	symbol: 'GOLD',
	description: 'Gold token. Granularity E-12.',
	granularity: Amount.fromUnsafe(1_000_000)._unsafeUnwrap(),
	isSupplyMutable: false,
	currentSupply: uint256Max,
	tokenInfoURL: new URL('https://www.goldtoken.com'),
	iconURL: new URL('https://www.image.goldtoken.com/'),
}

export const radixWrappedBitcoinToken: Token = {
	name: 'Bitcoin (wrapped on Radix)',
	rri: ResourceIdentifier.fromUnsafe('btcrw_rb1qyerpvjk')._unsafeUnwrap(),
	symbol: 'BTCRW',
	description: 'Radix wrapped Bitcoin. Granularity E-18.',
	granularity: Amount.fromUnsafe(1)._unsafeUnwrap(),
	isSupplyMutable: true,
	currentSupply: uint256Max,
	tokenInfoURL: new URL('https://www.bitcoin.radix.com'),
	iconURL: new URL('https://www.image.bitcoin.radix.com/'),
}

export const radixWrappedEtherToken: Token = {
	name: 'Ether (wrapped on Radix)',
	rri: ResourceIdentifier.fromUnsafe('ethrw_rb1qyeev2v5')._unsafeUnwrap(),
	symbol: 'ETHRW',
	description: 'Radix wrapped Ether. Granularity E-9.',
	granularity: Amount.fromUnsafe(1_000_000_000)._unsafeUnwrap(),
	isSupplyMutable: true,
	currentSupply: uint256Max,
	tokenInfoURL: new URL('https://www.ether.radix.com'),
	iconURL: new URL('https://www.image.ether.radix.com/'),
}

export const __fallBackAlexToken: Token = {
	name: 'Alex token',
	rri: ResourceIdentifier.fromUnsafe('alex_rb1qy7s58lc')._unsafeUnwrap(),
	symbol: 'ALEX',
	description:
		'Fallback token for when token for requested symbol was not found.',
	granularity: Amount.fromUnsafe(1)._unsafeUnwrap(),
	isSupplyMutable: true,
	currentSupply: uint256Max,
	tokenInfoURL: new URL('https://www.alex.token.com'),
	iconURL: new URL('https://www.image.alex.token.com/'),
}

export const balanceOfFor = (
	input: Readonly<{
		token: Token
		amount: AmountOrUnsafeInput
	}>,
): SimpleTokenBalance => {
	const amt = Amount.fromUnsafe(input.amount)._unsafeUnwrap()

	return {
		tokenIdentifier: input.token.rri,
		amount: amt.lt(input.token.currentSupply)
			? amt
			: input.token.currentSupply,
	}
}

export const balancesFor = (
	address: Acc0untAddressT,
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

const addressesString: string[] = [
	'brx1qspqljn9rg7x97s3rcvyzal2uxr5q22d9xn8nc4rpq8vq08kg4ch8yqhs9dq6',
	'brx1qsp0mejfswrmcy5xf9up2ve7zez7w2th0fw4ne8js0u0q22vya7kg8getv7av',
	'brx1qspvp5dklh3psxxegmrxvcxf657zfnh6z3t3snlh3qsa9twk56zlz3qyx6lhz',
	'brx1qsppfpt0shel54s245fsk576tpcck3588qd32nknp5tghln93ltvl2q9ytt32',
	'brx1qspp5vgf0l05ftl2qsu58u7zcel2gznfe9qduf0sfz20kt348fm8h6g0rs8g2',
	'brx1qsplvk5mts5unklcmdlgzuyr4nm3ez4lkax9g99mhdzv60lv52wdlnqc2zk90',
	'brx1qsp4mzazl97ynj37pud86e9l6ycam29qjtj89gl0j3ngs44wpf726gc2m9gwm',
	'brx1qspdcmak8mq5w359sjayu7rr6umsmechxjpj5jtdy3jku3zj9p8n8fqza8lzg',
	'brx1qsph24szj4jhl5ysefd8lma4el2lgpuhga7azwd9062r5hx98jw9mvssxl9cx',
	'brx1qspavumjx92gcetz2klgc23fr28s2pf9q0nfssdxf2cnsjhxt3k8q5qzt2jme',
	'brx1qspmk4lcn48p776g0djruqxyuy8f3l9639fpams8kuv0fwxsm9rqcsqfaw3rd',
	'brx1qsp6g9ey8erzare0kedr0ymw9x00xnspksnkmvkczwg9tqea490n8qcypnzq4',
	'brx1qspvrkaccvzd2cmh2w8awl4naxln5ssjuzarejl6fhakedhnkqn7d6qpflpty',
	'brx1qspte4df856phvm8zq3ns37g7ax6qj9sc2ud559pa9vlque30nuxlgq9hwucz',
	'brx1qsp4yj8ypkda0lt90yds8v8gknal0wwp4w8zzst5mtj7w6dr9gmlxdghckufj',
	'brx1qspshc06mfs9d4hp4n696s3kapal8sck4nyxzl38mufvz3kw8cgktvs7wvfem',
	'brx1qspvk7dj2af7x2nrccw58pe789a9s9hz6wyg9yqd6mnqetllr64gfdshs0adp',
	'brx1qspwmz963arljtpte327hw04axj9pkeav5r8gkdvx6jpyxtmd0esfwgsczr92',
	'brx1qspj2gpcnkc46x4t0lzqm6sxa0md42tfuwvshnuc0kg2zyt5mz5fs3saun8n2',
	'brx1qspmv3m7c70mdegm4dkwmlnekzdas58g8fp83snmf0wz9yqpkepf43gjhan7g',
	'brx1qspks7jgg0uksy8n7zvd6y93dpgy82653kq79mnk39eacyrjcnsy48ss8v8s3',
	'brx1qsp6s2epnqhgnshjvktkz7j8ycf948xvcgmwcde04a8pcrzeqfe7z3qmakp5k',
	'brx1qsp07ca60zv3heutkrguvd5j0f3a0y2785kynn9cfqrq2n4z962jxksthv4qp',
	'brx1qsplvt0dkj7494mqk4pu2m9j2v68h0w8t8l0z2xj2kl09x7a5ssnz6se4thng',
	'brx1qspc8cm2x2466x9n9tvurnvedqq9ukn95zjsfmhv2w04qkhgdx2dcrct7z9d2',
	'brx1qsp68th9ywzwdzq0vsnkqr07sa6hdflg0jzerk7x535ekxjrvzsk07szync20',
	'brx1qspxkq70fnkerexlfxeznkg2plxm4g25msu889t9z6pr3fqwyadev8gdn58en',
	'brx1qspk03jsd52z7pqtxh80rhcx8ej8ee9dz4skc3kx7vymztfed3cpttgdfwg37',
	'brx1qspp3ycx66gsm3r8vsycs04p9delgpu9h4y9agaw3v99rtd2fdyqh5cw4hquv',
	'brx1qspgp2ce5lfmvqj2zp4ky6nef0wh24us2gp2rrxzjxrmzvgvvs53kzgzscgad',
]

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
/*
* [Property in keyof ReturnType<typeof getAPI>]: ReturnType<
		typeof getAPI
	>[Property]
* */
export const castOfCharacters: Acc0untAddressT[] = addressesString
	.map((s) =>
		Acc0untAddress.fromUnsafe(s)._unsafeUnwrap({ withStackTrace: true }),
	)
	.slice(0, characterNames.length)
export const alice = castOfCharacters[0]
export const bob = castOfCharacters[1]
export const carol = castOfCharacters[2]
export const dan = castOfCharacters[3]
export const erin = castOfCharacters[4]

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
			infoURL: new URL('https://rewards.radixtokens.comcom'),
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
				const amtFactor = Amount.fromUnsafe(
					Math.max(10, amtOrZero),
				)._unsafeUnwrap()

				const amount = Amount.fromUnsafe(
					token.granularity.mul(amtFactor),
				)._unsafeUnwrap()
				return {
					token,
					amount,
				}
			},
		)
}

export const deterministicRandomBalancesForAddress = (
	address: Acc0untAddressT,
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
	address: Acc0untAddressT,
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
	address: Acc0untAddressT,
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
	const detRandomAddress = (): Acc0untAddressT =>
		castOfCharacters[anInt() % castOfCharacters.length]
	const detRandomValidatorAddress = detRandomValidatorAddressWithPRNG(anInt)
	const tokenAndAmounts = detRandBalanceOfTokenWithInfo(anInt)

	const deterministicRandomExecutedTransactions = (): ExecutedTransaction[] => {
		return Array(input.size)
			.fill(undefined)
			.map(
				(_, index): ExecutedTransaction => {
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

					const rndTxTypeInt = anInt() % 3
					const transactionType =
						rndTxTypeInt === 0
							? TransactionType.INCOMING
							: rndTxTypeInt === 1
							? TransactionType.FROM_ME_TO_ME
							: TransactionType.OUTGOING

					return {
						txID,
						sentAt: date,
						transactionType,
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
): SimpleExecutedTransaction => {
	const seed = sha256(Buffer.from(txID.__hex, 'hex'))
	const addressWithTXIdBytesAsSeed = Acc0untAddress.fromPublicKeyAndNetwork({
		publicKey: privateKeyFromBuffer(seed)._unsafeUnwrap().publicKey(),
		network: NetworkT.BETANET,
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
	address: Acc0untAddressT,
): Observable<SimpleTokenBalances> =>
	of(deterministicRandomBalancesForAddress(address))

export const deterministicRandomTXHistory = (
	input: TransactionHistoryRequestInput,
): Observable<TransactionHistory> =>
	of(deterministicRandomTxHistoryWithInput(input))

export const deterministicRandomLookupTX = (
	txID: TransactionIdentifierT,
): Observable<SimpleExecutedTransaction> =>
	of(deterministicRandomLookupTXUsingHist(txID))

export const deterministicRandomUnstakesForAddr = (
	address: Acc0untAddressT,
): Observable<UnstakePositions> =>
	of(deterministicRandomUnstakesForAddress(address))

export const deterministicRandomStakesForAddr = (
	address: Acc0untAddressT,
): Observable<StakePositions> =>
	of(deterministicRandomStakesForAddress(address))

export const makeThrowingRadixCoreAPI = (nodeUrl?: string): RadixCoreAPI => ({
	node: { url: new URL(nodeUrl ?? 'https://www.radixdlt.com/') },

	networkId: (): Observable<NetworkT> => {
		throw Error('Not implemented')
	},

	tokenBalancesForAddress: (
		_address: Acc0untAddressT,
	): Observable<SimpleTokenBalances> => {
		throw Error('Not implemented')
	},

	lookupTransaction: (
		_txID: TransactionIdentifierT,
	): Observable<SimpleExecutedTransaction> => {
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

	stakesForAddress: (
		_address: Acc0untAddressT,
	): Observable<StakePositions> => {
		throw Error('Not implemented')
	},

	unstakesForAddress: (
		_address: Acc0untAddressT,
	): Observable<UnstakePositions> => {
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
		network?: NetworkT
	}>,
): RadixCoreAPI => {
	txStatusMapCounter = new Map<TransactionIdentifierT, number>()
	return {
		node: { url: new URL(input?.nodeUrl ?? 'https://www.radixdlt.com/') },

		networkId: (): Observable<NetworkT> => {
			return of(input?.network ?? NetworkT.BETANET).pipe(shareReplay(1))
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
