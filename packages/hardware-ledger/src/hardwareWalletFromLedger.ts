import { from, Observable, of, Subject, Subscription, throwError } from 'rxjs'
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
import { Transaction } from '@radixdlt/tx-parser/dist/transaction'
import { InstructionT } from '@radixdlt/tx-parser'

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
		const subs = new Subscription()

		const transactionRes = Transaction.fromBuffer(
			Buffer.from(input.tx.blob, 'hex'),
		)
		if (transactionRes.isErr()) {
			const errMsg = `Failed to parse tx, underlying error: ${msgFromError(
				transactionRes.error,
			)}`
			log.error(errMsg)
			return throwError(new Error(errMsg))
		}
		const transaction = transactionRes.value
		const instructions = transaction.instructions
		const numberOfInstructions = instructions.length

		const sendInstructionSubject = new Subject<InstructionT>()
		const signatureBytesSubject = new Subject<Buffer>()
		const signatureSubject = new Subject<SignatureT>()

		const maxBytesPerExchange = 255

		const nextInstructionToSend = (): InstructionT => {
			const instructionToSend: InstructionT = instructions.shift()! // "pop first"
			log.debug(
				`Sending instruction 📦 #${
					numberOfInstructions - instructions.length
				}/#${numberOfInstructions}. (length: #${
					instructionToSend.toBuffer().length
				} bytes).`,
			)
			return instructionToSend
		}

		const sendInstruction = (): void => {
			sendInstructionSubject.next(nextInstructionToSend())
		}

		const finishedSendingWholeTx = (): boolean => instructions.length === 0

		subs.add(
			ledgerNano
				.sendAPDUToDevice(
					RadixAPDU.signTX.initialSetup({
						path: input.path ?? path000H,
						txByteCount: input.tx.blob.length,
						numberOfInstructions,
					}),
				)
				.subscribe({
					next: _irrelevantBuf => {
						sendInstruction()
					},
					error: error => {
						sendInstructionSubject.error(error)
					},
				}),
		)

		subs.add(
			sendInstructionSubject
				.pipe(
					mergeMap(nextInstruction => {
						const instructionBytes = nextInstruction.toBuffer()
						if (instructionBytes.length > maxBytesPerExchange) {
							const errMsg = `Failed to send instruction, it is longer than max allowed payload size of ${maxBytesPerExchange}, specifically #${instructionBytes.length} bytes.`
							return throwError(new Error(errMsg))
						}
						return of(instructionBytes)
					}),
					mergeMap(
						(instructionBytes): Observable<Buffer> =>
							ledgerNano.sendAPDUToDevice(
								RadixAPDU.signTX.stream({
									instructionBytes,
								}),
							),
					),
					tap({
						next: (responseFromLedger: Buffer) => {
							if (finishedSendingWholeTx()) {
								signatureBytesSubject.next(responseFromLedger)
							} else {
								sendInstruction()
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
