import { from, Observable, Subject, Subscription, throwError } from 'rxjs'
import {
	ECPointOnCurve,
	ECPointOnCurveT,
	HDPathRadixT,
	PublicKey,
	PublicKeyT,
	Signature,
	SignatureT,
} from '@radixdlt/crypto'
import { map, mergeMap, take, tap } from 'rxjs/operators'
import {
	msgFromError,
	readBuffer,
	toObservableFromResult,
} from '@radixdlt/util'
import {
	GetPublicKeyInput,
	HardwareSigningKeyT,
	HardwareWalletT,
	HardwareWalletWithoutSK,
	KeyExchangeInput,
	path000H,
	SemVerT,
	SignHashInput,
	SemVer,
	signingKeyWithHardWareWallet,
	SignTransactionInput,
} from '@radixdlt/hardware-wallet'
import { RadixAPDU } from './apdu'
import { LedgerNanoT } from './_types'
import { LedgerNano } from './ledgerNano'
import { log } from '@radixdlt/util'
import { BuiltTransactionReadyToSign } from '@radixdlt/primitives'

type ParsedTXAction = Readonly<{
	indexInTx: number
	bytes: Buffer
}>
const parseActions = (tx: BuiltTransactionReadyToSign): ParsedTXAction[] =>
	// TODO replaced mocked data
	[]

const TXParser = {
	parseActions,
}

const withLedgerNano = (ledgerNano: LedgerNanoT): HardwareWalletT => {
	const getPublicKey = (input: GetPublicKeyInput): Observable<PublicKeyT> =>
		ledgerNano
			.sendAPDUToDevice(
				RadixAPDU.getPublicKey({
					path: input.path ?? path000H,
					displayAddress: input.displayAddress ?? false, // passing 'false' is convenient for testing,
					// verifyAddressOnDeviceForNetwork:
					// 	input.verifyAddressOnDeviceForNetwork,
				}),
			)
			.pipe(
				mergeMap(
					(buf): Observable<PublicKeyT> => {
						// Response `buf`: pub_key_len (1) || pub_key (var) || chain_code_len (1) || chain_code (var)
						const readNextBuffer = readBuffer(buf)

						const publicKeyLengthResult = readNextBuffer(1)
						if (publicKeyLengthResult.isErr()) {
							const errMsg = `Failed to parse length of public key from response buffer: ${msgFromError(
								publicKeyLengthResult.error,
							)}`
							log.error(errMsg)
							return throwError(new Error(errMsg))
						}
						const publicKeyLength = publicKeyLengthResult.value.readUIntBE(
							0,
							1,
						)
						const publicKeyBytesResult = readNextBuffer(
							publicKeyLength,
						)

						if (publicKeyBytesResult.isErr()) {
							const errMsg = `Failed to parse public key bytes from response buffer: ${msgFromError(
								publicKeyBytesResult.error,
							)}`
							log.error(errMsg)
							return throwError(new Error(errMsg))
						}
						const publicKeyBytes = publicKeyBytesResult.value

						// We ignore remaining bytes, being: `chain_code_len (1) || chain_code (var)`

						return toObservableFromResult(
							PublicKey.fromBuffer(publicKeyBytes),
						)
					},
				),
			)

	const getVersion = (): Observable<SemVerT> =>
		ledgerNano
			.sendAPDUToDevice(RadixAPDU.getVersion())
			.pipe(
				mergeMap(buf => toObservableFromResult(SemVer.fromBuffer(buf))),
			)

	const doSignHash = (input: SignHashInput): Observable<SignatureT> =>
		ledgerNano
			.sendAPDUToDevice(
				RadixAPDU.doSignHash({
					path: input.path ?? path000H,
					displayAddress: input.displayAddress ?? false,
					hashToSign: input.hashToSign,
				}),
			)
			.pipe(
				mergeMap(
					(buf: Buffer): Observable<SignatureT> => {
						// Response `buf`: pub_key_len (1) || pub_key (var) || chain_code_len (1) || chain_code (var)
						const readNextBuffer = readBuffer(buf)

						const signatureDERlengthResult = readNextBuffer(1)
						if (signatureDERlengthResult.isErr()) {
							const errMsg = `Failed to parse length of signature from response buffer: ${msgFromError(
								signatureDERlengthResult.error,
							)}`
							log.error(errMsg)
							return throwError(new Error(errMsg))
						}
						const signatureDERlength = signatureDERlengthResult.value.readUIntBE(
							0,
							1,
						)
						const signatureDERBytesResult = readNextBuffer(
							signatureDERlength,
						)

						if (signatureDERBytesResult.isErr()) {
							const errMsg = `Failed to parse Signature DER bytes from response buffer: ${msgFromError(
								signatureDERBytesResult.error,
							)}`
							log.error(errMsg)
							return throwError(new Error(errMsg))
						}
						const signatureDERBytes = signatureDERBytesResult.value

						// We ignore remaining bytes, being: `Signature.V (1)`

						return toObservableFromResult(
							Signature.fromDER(signatureDERBytes),
						)
					},
				),
			)

	const doKeyExchange = (
		input: KeyExchangeInput,
	): Observable<ECPointOnCurveT> =>
		ledgerNano
			.sendAPDUToDevice(
				RadixAPDU.doKeyExchange({
					...input,
					path: input.path ?? path000H,
					displayBIPAndPubKeyOtherParty:
						input.displayBIPAndPubKeyOtherParty,
					// displaySharedKeyOnDevice: input.displaySharedKeyOnDevice,
				}),
			)
			.pipe(
				mergeMap(
					(buf: Buffer): Observable<ECPointOnCurveT> => {
						// Response `buf`: sharedkeyPointLen (1) || sharedKeyPoint (var)
						const readNextBuffer = readBuffer(buf)

						const sharedKeyPointLengthResult = readNextBuffer(1)
						if (sharedKeyPointLengthResult.isErr()) {
							const errMsg = `Failed to parse length of shared key point from response buffer: ${msgFromError(
								sharedKeyPointLengthResult.error,
							)}`
							log.error(errMsg)
							return throwError(new Error(errMsg))
						}
						const sharedKeyPointLength = sharedKeyPointLengthResult.value.readUIntBE(
							0,
							1,
						)

						const sharedKeyPointBytesResult = readNextBuffer(
							sharedKeyPointLength,
						)

						if (sharedKeyPointBytesResult.isErr()) {
							const errMsg = `Failed to parse shared key point bytes from response buffer: ${msgFromError(
								sharedKeyPointBytesResult.error,
							)}`
							log.error(errMsg)
							return throwError(new Error(errMsg))
						}
						const sharedKeyPointBytes =
							sharedKeyPointBytesResult.value

						return toObservableFromResult(
							ECPointOnCurve.fromBuffer(sharedKeyPointBytes),
						)
					},
				),
			)

	const doSignTransaction = (
		input: SignTransactionInput,
	): Observable<SignatureT> => {
		const { tx } = input
		const txBytes = Buffer.from(tx.blob, 'hex')
		const subs = new Subscription()

		const actions = TXParser.parseActions(tx)
		const numberOfActions = actions.length

		const streamSubject = new Subject<void>()
		const signatureBytesSubject = new Subject<Buffer>()
		const signatureSubject = new Subject<SignatureT>()

		const txByteCount = tx.blob.length
		let actionsSent = 0
		let txBytesThatHasBeenExchanged = 0
		const maxBytesPerExchange = 255
		const txBytesLeftToStream = (): number =>
			Math.min(
				maxBytesPerExchange,
				txByteCount - txBytesThatHasBeenExchanged,
			)

		const continueStream = (): void => {
			streamSubject.next(undefined)
		}
		const startStreamingTXBytes = (): void => {
			continueStream()
		}

		const bufferFromNextActionInTxToStream = (): ParsedTXAction => {
			const txActionToStream = actions[actionsSent]
			log.debug(
				`🌊 streaming action 📦${actionsSent} #${txActionToStream.bytes.length} tx bytes, #${txBytesThatHasBeenExchanged}/#${txByteCount}.`,
			)
			return txActionToStream
		}

		const finishedStreamingWholeTx = (): boolean => {
			if (txBytesThatHasBeenExchanged < txByteCount) {
				return false
			}
			if (txBytesThatHasBeenExchanged > txByteCount) {
				const errMsg = `Incorrect implementation, streamed more bytes than the size of transaction, which should never be the case. I have an idea of what might be wrong, we are probably adding 2 too many bytes per slice, not having excluded the 2 bytes response CODE that was also returned from Ledger Device. We should subtract 2 bytes when we are increasing the value of 'txBytesThatHasBeenExchanged'.`
				log.error(errMsg)
				throw new Error(errMsg)
			}
			return true
		}

		subs.add(
			ledgerNano
				.sendAPDUToDevice(
					RadixAPDU.signTX.initialSetup({
						path: input.path ?? path000H,
						txByteCount,
						numberOfActions,
					}),
				)
				.subscribe({
					next: _irrelevantBuf => {
						startStreamingTXBytes()
					},
					error: error => {
						streamSubject.error(error)
					},
				}),
		)

		subs.add(
			streamSubject
				.pipe(
					mergeMap(
						(_ign): Observable<Buffer> => {
							const nextActionToStream = bufferFromNextActionInTxToStream()
							return ledgerNano
								.sendAPDUToDevice(
									RadixAPDU.signTX.stream({
										bytesToStreamToLedgerDevice:
											nextActionToStream.bytes,
										actionIndex:
											nextActionToStream.indexInTx,
									}),
								)
								.pipe(
									tap({
										next: _ => {
											txBytesThatHasBeenExchanged +=
												nextActionToStream.bytes.length
											actionsSent += 1
										},
									}),
								)
						},
					),
					tap({
						next: (responseFromLedger: Buffer) => {
							if (finishedStreamingWholeTx()) {
								signatureBytesSubject.next(responseFromLedger)
							} else {
								continueStream()
							}
						},
					}),
				)
				.subscribe({
					error: (error: unknown) => {
						const errMsg = `Failed to sign tx with Ledger, underlying error while streaming tx bytes: '${msgFromError(
							error,
						)}'`
						log.error(errMsg)
						signatureSubject.error(new Error(errMsg))
					},
				}),
		)

		subs.add(
			signatureBytesSubject.subscribe({
				next: (bytes: Buffer) => {
					const signatureResult = Signature.fromRSBuffer(bytes)
					if (!signatureResult.isOk()) {
						const errMsg = `Failed to parse signature from response from Ledger, underlying error: '${msgFromError(
							signatureResult.error,
						)}'`
						log.error(errMsg)
						signatureSubject.error(new Error(errMsg))
						return
					}
					const signature: SignatureT = signatureResult.value
					signatureSubject.next(signature)
				},
			}),
		)

		return signatureSubject.asObservable().pipe(take(1))
	}

	const hwWithoutSK: HardwareWalletWithoutSK = {
		getPublicKey,
		getVersion,
		doSignHash,
		doKeyExchange,
		doSignTransaction,
	}

	return {
		...hwWithoutSK,
		makeSigningKey: (path: HDPathRadixT): Observable<HardwareSigningKeyT> =>
			signingKeyWithHardWareWallet(hwWithoutSK, path),
	}
}

const create = (): Observable<HardwareWalletT> => {
	const ledgerNano$ = from(
		LedgerNano.connect({
			// 2 minutes timeout arbitrarily chosen
			deviceConnectionTimeout: 2 * 60 * 1_000,
		}),
	)

	return ledgerNano$.pipe(
		map((ledger: LedgerNanoT) => withLedgerNano(ledger)),
	)
}

export const HardwareWalletLedger = {
	create,
	from: withLedgerNano,
}
