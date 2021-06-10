/**
 * @group integration
 */

/* eslint-disable */

import { SemVerT, SignTXOutput } from '@radixdlt/hardware-wallet'
import { log } from '@radixdlt/util'
import { Subscription } from 'rxjs'
import {
	testDoKeyExchange,
	testDoSignHash,
	testGetVersion,
} from '../hardwareTestUtils'
import { LedgerNanoT, LedgerNano, HardwareWalletLedger } from '../../src'
import {
	HDPathRadix,
	PublicKey, PublicKeyT,
	sha256Twice,
} from '@radixdlt/crypto'
import { BuiltTransactionReadyToSign, NetworkT } from '@radixdlt/primitives'
import { Transaction } from '@radixdlt/tx-parser/dist/transaction'
import { TransactionT } from '@radixdlt/tx-parser'
import { AccountAddress } from '@radixdlt/account'

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
			deviceConnectionTimeout: 1_000,
		})
		const hardwareWallet = HardwareWalletLedger.from(ledgerNano)

		testGetVersion({
			hardwareWallet,
			onResponse: (version: SemVerT) => {
				expect(version.toString()).toBe('0.3.1')
				done()
			},
		})
	})

	it('getPublicKey_integration', async done => {
		ledgerNano = await LedgerNano.connect({
			deviceConnectionTimeout: 1_000,
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

	it.only('doKeyExchange_integration', async done => {
		ledgerNano = await LedgerNano.connect({
			deviceConnectionTimeout: 1_000,
		})
		const hardwareWallet = HardwareWalletLedger.from(ledgerNano)

		testDoKeyExchange({
			hardwareWallet,
			displayBIPAndPubKeyOtherParty: true,
			onResponse: _pointOncurve => {
				done()
			},
		})
	}, 40_000)

	it('doSignHash_integration', async done => {
		ledgerNano = await LedgerNano.connect({
			deviceConnectionTimeout: 1_000,
		})
		const hardwareWallet = HardwareWalletLedger.from(ledgerNano)

		const subs = new Subscription()

		const path = HDPathRadix.fromString(`m/44'/536'/2'/1/3`)._unsafeUnwrap()

		const expectedPubKeyHex =
			'026d5e07cfde5df84b5ef884b629d28d15b0f6c66be229680699767cd57c618288'
		const expectedPubKey = PublicKey.fromBuffer(
			Buffer.from(expectedPubKeyHex, 'hex'),
		)._unsafeUnwrap()

		const blobHex =
			'0a000104374c00efbe61f645a8b35d7746e106afa7422877e5d607975b6018e0a1aa6bf0000000040921000000000000000000000000000000000000000000000000000000000000000002010301040377bac8066e51cd0d6b320c338d5abbcdbcca25572b6b3eee9443eafc92106bba000000000000000000000000000000000000000000000001158e460913cffffe000500000003010301040377bac8066e51cd0d6b320c338d5abbcdbcca25572b6b3eee9443eafc92106bba0000000000000000000000000000000000000000000000008ac7230489e7fffe0104040377bac8066e51cd0d6b320c338d5abbcdbcca25572b6b3eee9443eafc92106bba02f19b2d095a553f3a41da4a8dc1f8453dfbdc733c5aece8b128b7d7999ae247a50000000000000000000000000000000000000000000000008ac7230489e80000000700dcb252005545207d4d0e0a72952acccf9466087fbecee7d5851467869aa8d6566dd9476f5e719fe1025dee78f975d9b5a5d136ced8e51cfcd7b7c85563edb23b'
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
		console.log(`🔮 signing tx:\n${parsedTx.toString()}`)

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
					},
					e => {
						throw e
					},
				),
		)
	}, 20_000)

	it('doSignTX_integration', async done => {
		ledgerNano = await LedgerNano.connect({
			deviceConnectionTimeout: 1_000,
		})
		const hardwareWallet = HardwareWalletLedger.from(ledgerNano)

		testDoSignHash({
			hardwareWallet,
			onResponse: _signature => {
				done()
			},
		})
	}, 40_000)
})
