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
	SignTXOutput,
} from '@radixdlt/hardware-wallet'
import { RadixAPDU } from './apdu'
import { LedgerNanoT } from './_types'
import { LedgerNano } from './ledgerNano'
import { log, BufferReader } from '@radixdlt/util'
import { Transaction } from '@radixdlt/tx-parser/dist/transaction'
import { InstructionT } from '@radixdlt/tx-parser'
import { err, Result } from 'neverthrow'

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

	const parseSignatureFromLedger = (
		buf: Buffer,
	): Result<{ signature: SignatureT; remainingBytes: Buffer }, Error> => {
		// Response `buf`: pub_key_len (1) || pub_key (var) || chain_code_len (1) || chain_code (var)
		const bufferReader = BufferReader.create(buf)

		const signatureDERlengthResult = bufferReader.readNextBuffer(1)
		if (signatureDERlengthResult.isErr()) {
			const errMsg = `Failed to parse length of signature from response buffer: ${msgFromError(
				signatureDERlengthResult.error,
			)}`
			log.error(errMsg)
			return err(new Error(errMsg))
		}
		const signatureDERlength = signatureDERlengthResult.value.readUIntBE(
			0,
			1,
		)
		const signatureDERBytesResult = bufferReader.readNextBuffer(
			signatureDERlength,
		)

		if (signatureDERBytesResult.isErr()) {
			const errMsg = `Failed to parse Signature DER bytes from response buffer: ${msgFromError(
				signatureDERBytesResult.error,
			)}`
			log.error(errMsg)
			return err(new Error(errMsg))
		}
		const signatureDERBytes = signatureDERBytesResult.value

		// We ignore remaining bytes, being: `Signature.V (1)`

		return Signature.fromDER(signatureDERBytes).map(signature => ({
			signature,
			remainingBytes: bufferReader.remainingBytes(),
		}))
	}

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
					(buf: Buffer): Observable<SignatureT> =>
						toObservableFromResult(
							parseSignatureFromLedger(buf).map(r => r.signature),
						),
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
	): Observable<SignTXOutput> => {
		const {
			displayInstructionContentsOnLedgerDevice,
			displayTXSummaryOnLedgerDevice,
		} = input

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
		const resultBufferFromLedgerSubject = new Subject<Buffer>()
		const outputSubject = new Subject<SignTXOutput>()

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

		const moreInstructionsToSend = (): boolean => instructions.length > 0

		subs.add(
			ledgerNano
				.sendAPDUToDevice(
					RadixAPDU.signTX.initialSetup({
						path: input.path ?? path000H,
						txByteCount: input.tx.blob.length,
						numberOfInstructions,
						nonNativeTokenRriHRP: input.nonNativeTokenRriHRP,
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
								RadixAPDU.signTX.singleInstruction({
									instructionBytes,
									isLastInstruction: !moreInstructionsToSend(),
									displayInstructionContentsOnLedgerDevice,
									displayTXSummaryOnLedgerDevice,
								}),
							),
					),
					tap({
						next: (responseFromLedger: Buffer) => {
							if (!moreInstructionsToSend()) {
								resultBufferFromLedgerSubject.next(
									responseFromLedger,
								)
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
						outputSubject.error(new Error(errMsg))
					},
				}),
		)

		subs.add(
			resultBufferFromLedgerSubject.subscribe({
				next: (bytes: Buffer) => {
					const parsedResult = parseSignatureFromLedger(bytes)

					if (!parsedResult.isOk()) {
						const errMsg = `Failed to parse signature from response from Ledger, underlying error: '${msgFromError(
							parsedResult.error,
						)}'`
						log.error(errMsg)
						outputSubject.error(new Error(errMsg))
						return
					}
					const signature: SignatureT = parsedResult.value.signature
					const remainingBytes = parsedResult.value.remainingBytes
					const signatureV = remainingBytes.readUInt8()
					console.log(`Signature V: ${signatureV}`)
					const hash = remainingBytes.slice(1)
					if (hash.length !== 32) {
						const errMsg = `Expected hash to have 32 bytes length`
						log.error(errMsg)
						outputSubject.error(new Error(errMsg))
						return
					}

					console.log(
						`Ledger app produced hash: ${hash.toString('hex')}`,
					)

					outputSubject.next({
						signature,
						signatureV,
						hashCalculatedByLedger: hash,
					})
				},
			}),
		)

		return outputSubject.asObservable().pipe(take(1))
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
