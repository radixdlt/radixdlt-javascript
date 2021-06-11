/**
 * @group integration
 */

/* eslint-disable */

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
import { Transaction } from '@radixdlt/tx-parser/dist/transaction'
import { TransactionT } from '@radixdlt/tx-parser'
import { AccountAddress } from '@radixdlt/account'
import { stringifyUInt256 } from '@radixdlt/tx-parser/dist/tokens'

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
		ledgerNano = await LedgerNano.connect({
			deviceConnectionTimeout: 10_000,
		})
		const hardwareWallet = HardwareWalletLedger.from(ledgerNano)

		const subs = new Subscription()

		subs.add(
			hardwareWallet.getVersion().subscribe({
				next: (semVer: SemVerT) => {
					expect(semVer.toString()).toBe('0.3.1')
					done()
				},
				error: e => {
					done(e)
				},
			}),
		)
	})

	it('getPublicKey_integration', async done => {
		ledgerNano = await LedgerNano.connect({
			deviceConnectionTimeout: 10_000,
		})
		const hardwareWallet = HardwareWalletLedger.from(ledgerNano)

		const subs = new Subscription()

		const path = HDPathRadix.fromString(`m/44'/536'/2'/1/3`)._unsafeUnwrap()
		const displayAddress = true

		const expectedPubKeyHex =
			'026d5e07cfde5df84b5ef884b629d28d15b0f6c66be229680699767cd57c618288'

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
					displayAddress,
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
		ledgerNano = await LedgerNano.connect({
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
						`m/44'/536'/2'/1/3`,
					)._unsafeUnwrap(),
					publicKeyOfOtherParty,
					displayBIPAndPubKeyOtherParty,
				})
				.subscribe(
					(ecPointOnCurve: ECPointOnCurveT) => {
						expect(ecPointOnCurve.toString()).toBe(
							'6d5e07cfde5df84b5ef884b629d28d15b0f6c66be229680699767cd57c6182883fa2aff69be05f792a02d6ef657240b17c44614a53e45dff4c529bfb012b9646',
						)
						done()
					},
					e => {
						done(e)
					},
				),
		)
	}, 20_000)

	it.only(
		'doSignTX_integration',
		async done => {
			ledgerNano = await LedgerNano.connect({
				deviceConnectionTimeout: 20_000,
			})
			const hardwareWallet = HardwareWalletLedger.from(ledgerNano)

			const subs = new Subscription()

			const path = HDPathRadix.fromString(
				`m/44'/536'/2'/1/3`,
			)._unsafeUnwrap()

			const expectedPubKeyHex =
				'026d5e07cfde5df84b5ef884b629d28d15b0f6c66be229680699767cd57c618288'
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
						nonNativeTokenRriHRP: 'btc',
						tx,
						displayInstructionContentsOnLedgerDevice: true,
						displayTXSummaryOnLedgerDevice: true,
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
		ledgerNano = await LedgerNano.connect({
			deviceConnectionTimeout: 10_000,
		})
		const hardwareWallet = HardwareWalletLedger.from(ledgerNano)

		const subs = new Subscription()

		const hashToSign = sha256Twice(
			`I'm testing Radix awesome hardware wallet!`,
		)

		const path = HDPathRadix.fromString(`m/44'/536'/2'/1/3`)._unsafeUnwrap()

		const displayAddress = true

		if (displayAddress) {
			console.log(`🔮 Path: ${path.toString()}`)
			console.log(`🔮 Hash: ${hashToSign.toString('hex')}`)
		}

		subs.add(
			hardwareWallet
				.doSignHash({
					path,
					hashToSign,
					displayAddress,
				})
				.subscribe(
					(signature: SignatureT) => {
						expect(signature.toDER()).toBe(
							'3044022078b0d2d17d227a8dd14ecdf0d7d65580ac6c17ab980c50074e6c096c4081313202207a9819ceedab3bfd3d22452224394d6cb41e3441f4675a5e7bf58f059fdf34cd',
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
