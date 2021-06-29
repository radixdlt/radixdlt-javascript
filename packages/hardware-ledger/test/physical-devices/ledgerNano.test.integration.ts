/**
 * @group integration
 */

/* eslint-disable */
/*
import { SemVerT, SignTXOutput } from '@radixdlt/hardware-wallet'
import { log } from '@radixdlt/util'
import { Subscription } from 'rxjs'
import { LedgerNanoT, LedgerNano, HardwareWalletLedger } from '../../src'
import {
	ECPointOnCurveT,
	HDPathRadix,
	PublicKey,
	PublicKeyT,
	sha256Twice,
	SignatureT,
} from '@radixdlt/crypto'
import {
	BuiltTransactionReadyToSign,
	NetworkT,
	uint256FromUnsafe,
} from '@radixdlt/primitives'
import { Transaction } from '@radixdlt/tx-parser'
import { TransactionT } from '@radixdlt/tx-parser'
import { AccountAddress } from '@radixdlt/account'
import { stringifyUInt256 } from '@radixdlt/tx-parser/dist/tokens'
// @ts-ignore
import TransportNodeHid from '@aleworm/hw-transport-node-hid'

describe('hw_ledger_integration', () => {
	let ledgerNano: LedgerNanoT
	beforeAll(() => {
		log.setLevel('debug')
	})

	afterEach(done => {
		if (!ledgerNano) {
			done()
			return
		}
		const subs = new Subscription()
		// must close connection in between else finding a free ledger device for subsequent test will fail.
		subs.add(
			ledgerNano.close().subscribe(() => {
				done()
			}),
		)
	})

	afterAll(() => {
		log.setLevel('warn')
	})

	it('getVersion_integration', async done => {
		const transport = await TransportNodeHid.create()

		ledgerNano = await LedgerNano.connect(transport, {
			deviceConnectionTimeout: 10_000,
		})
		const hardwareWallet = HardwareWalletLedger.from(ledgerNano)

		const subs = new Subscription()

		subs.add(
			hardwareWallet.getVersion().subscribe({
				next: (semVer: SemVerT) => {
					expect(semVer.toString()).toBe('0.3.5')
					done()
				},
				error: e => {
					done(e)
				},
			}),
		)
	})

	it('getPublicKey_integration', async done => {
		const transport = await TransportNodeHid.create()

		ledgerNano = await LedgerNano.connect(transport, {
			deviceConnectionTimeout: 10_000,
		})
		const hardwareWallet = HardwareWalletLedger.from(ledgerNano)

		const subs = new Subscription()

		const path = HDPathRadix.fromString(`m/44'/1022'/2'/1/3`)._unsafeUnwrap()
		const displayAddress = true

		const expectedPubKeyHex =
			'03d79039c428a6b835e136fbb582e9259df23f8660f928367c3f0d6912728a8444'

		const expectedPubKey = PublicKey.fromBuffer(
			Buffer.from(expectedPubKeyHex, 'hex'),
		)._unsafeUnwrap()

		if (displayAddress) {
			console.log(`🔮 expected path: ${path.toString()}`)
			const accountAddress = AccountAddress.fromPublicKeyAndNetwork({
				publicKey: expectedPubKey,
				network: NetworkT.BETANET,
			})
			const wrongAccountAddress = AccountAddress.fromPublicKeyAndNetwork({
				publicKey: expectedPubKey,
				network: NetworkT.MAINNET,
			})
			console.log(
				`🔮 expected address: '${accountAddress.toString()}' ([wrong]mainnet: '${wrongAccountAddress.toString()}')`,
			)
		}

		subs.add(
			hardwareWallet
				.getPublicKey({
					path,
					display: displayAddress,
				})
				.subscribe(
					(publicKey: PublicKeyT) => {
						expect(publicKey.toString(true)).toBe(expectedPubKeyHex)
						done()
					},
					e => {
						done(e)
					},
				),
		)
	})

	it('doKeyExchange_integration', async done => {
		const transport = await TransportNodeHid.create()

		ledgerNano = await LedgerNano.connect(transport, {
			deviceConnectionTimeout: 10_000,
		})
		const hardwareWallet = HardwareWalletLedger.from(ledgerNano)

		const subs = new Subscription()

		const publicKeyOfOtherParty = PublicKey.fromBuffer(
			Buffer.from(
				'0479be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8',
				'hex',
			),
		)._unsafeUnwrap()

		const displayBIPAndPubKeyOtherParty = true

		if (displayBIPAndPubKeyOtherParty) {
			console.log(
				`🔮 publicKeyOfOtherParty: ${publicKeyOfOtherParty.toString(
					false,
				)}`,
			)

			const accountAddressOfOtherParty = AccountAddress.fromPublicKeyAndNetwork(
				{
					publicKey: publicKeyOfOtherParty,
					network: NetworkT.BETANET,
				},
			)

			console.log(
				`🔮 other party address: ${accountAddressOfOtherParty.toString()}`,
			)
		}

		subs.add(
			hardwareWallet
				.doKeyExchange({
					// both Account and Address will be hardened.
					path: HDPathRadix.fromString(
						`m/44'/1022'/2'/1/3`,
					)._unsafeUnwrap(),
					publicKeyOfOtherParty,
					displayBIPAndPubKeyOtherParty,
				})
				.subscribe(
					(ecPointOnCurve: ECPointOnCurveT) => {
						expect(ecPointOnCurve.toString()).toBe(
							'd79039c428a6b835e136fbb582e9259df23f8660f928367c3f0d6912728a8444a87d3a07191942666ca3d0396374531fe669e451bae6eeb79fb0884ef78a2f9d',
						)
						done()
					},
					e => {
						done(e)
					},
				),
		)
	}, 20_000)

	it(
		'doSignTX_integration',
		async done => {
			const transport = await TransportNodeHid.create()

			ledgerNano = await LedgerNano.connect(transport, {
				deviceConnectionTimeout: 20_000,
			})
			const hardwareWallet = HardwareWalletLedger.from(ledgerNano)

			const subs = new Subscription()

			const path = HDPathRadix.fromString(
				`m/44'/1022'/2'/1/3`,
			)._unsafeUnwrap()

			const expectedPubKeyHex =
				'03d79039c428a6b835e136fbb582e9259df23f8660f928367c3f0d6912728a8444'
			const expectedPubKey = PublicKey.fromBuffer(
				Buffer.from(expectedPubKeyHex, 'hex'),
			)._unsafeUnwrap()

			const blobHex =
				'0a000104374c00efbe61f645a8b35d7746e106afa7422877e5d607975b6018e0a1aa6bf0000000040921000000000000000000000000000000000000000000000000000000000000000002010301040377bac8066e51cd0d6b320c338d5abbcdbcca25572b6b3eee9443eafc92106bba000000000000000000000000000000000000000000000001158e460913cffffe000500000003010301040377bac8066e51cd0d6b320c338d5abbcdbcca25572b6b3eee9443eafc92106bba0000000000000000000000000000000000000000000000008ac7230489e7fffe0104040377bac8066e51cd0d6b320c338d5abbcdbcca25572b6b3eee9443eafc92106bba02f19b2d095a553f3a41da4a8dc1f8453dfbdc733c5aece8b128b7d7999ae247a50000000000000000000000000000000000000000000000008ac7230489e8000000'
			const blob = Buffer.from(blobHex, 'hex')
			const txRes = Transaction.fromBuffer(blob)
			if (txRes.isErr()) {
				throw txRes.error
			}
			const parsedTx: TransactionT = txRes.value

			const expectedHash = sha256Twice(Buffer.from(blobHex, 'hex'))
			const tx: BuiltTransactionReadyToSign = {
				blob: blobHex,
				hashOfBlobToSign: expectedHash.toString('hex'),
			}

			console.log(`🔮 Path: ${path.toString()}`)
			console.log(`🔮 Expected Hash: ${expectedHash.toString('hex')}`)
			console.log(`🔮 Signing tx:\n${parsedTx.toString()}`)

			const totalCostDecATTOString = '29999999999999999998' // sum of tx fee and two token transfers: 2 + 19999999999999999998 + 9999999999999999998
			const totalCost = uint256FromUnsafe(
				totalCostDecATTOString,
			)._unsafeUnwrap()
			console.log(
				`🔮 Expected total cost incl tx fee in XRD: ${stringifyUInt256(
					totalCost,
				)} (atto: ${totalCost.toString(10)})`,
			)
			subs.add(
				hardwareWallet
					.doSignTransaction({
						path,
						nonXrdHRP: 'btc',
						tx
					})
					.subscribe(
						(result: SignTXOutput) => {
							const hashCalculatedByLedger =
								result.hashCalculatedByLedger
							const signature = result.signature

							expect(hashCalculatedByLedger.toString('hex')).toBe(
								expectedHash.toString('hex'),
							)
							expect(
								expectedPubKey.isValidSignature({
									signature,
									hashedMessage: hashCalculatedByLedger,
								}),
							).toBe(true)

							done()
						},
						e => {
							done(e)
						},
					),
			)
		},
		10 * 60 * 1_000,
	) // 10 min

	it('doSignHash_integration', async done => {
		const transport = await TransportNodeHid.create()

		ledgerNano = await LedgerNano.connect(transport, {
			deviceConnectionTimeout: 10_000,
		})
		const hardwareWallet = HardwareWalletLedger.from(ledgerNano)

		const subs = new Subscription()

		const hashToSign = sha256Twice(
			`I'm testing Radix awesome hardware wallet!`,
		)

		const path = HDPathRadix.fromString(`m/44'/1022'/2'/1/3`)._unsafeUnwrap()

		console.log(`🔮 Path: ${path.toString()}`)
		console.log(`🔮 Hash: ${hashToSign.toString('hex')}`)

		subs.add(
			hardwareWallet
				.doSignHash({
					path,
					hashToSign,
				})
				.subscribe(
					(signature: SignatureT) => {
						expect(signature.toDER()).toBe(
							'3045022100de5f8c5a92cc5bea386d7a5321d0aa1b46fc7d90c5d07098346252aacd59e52302202bbaeef1256d0185b550a7b661557eea11bb98b99ccc7e01d19fd931e617e824',
						)
						done()
					},
					e => {
						done(e)
					},
				),
		)
	}, 40_000)
})
*/
