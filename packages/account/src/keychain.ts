import {
	BehaviorSubject,
	combineLatest,
	firstValueFrom,
	Observable,
	of,
	ReplaySubject,
	Subscription,
	throwError,
} from 'rxjs'
import { SigningKey, isSigningKey, SigningKeyT } from './keypair'
import {
	SigningKeysT,
	DeriveNextInput,
	SwitchSigningKeyInput,
	SwitchToSigningKey,
	SwitchToIndex,
	AddSigningKeyByPrivateKeyInput,
	SigningKeychainT,
	DeriveHWSigningKeyInput,
	Signing,
} from './_types'
import { map, mergeMap, shareReplay, take, tap } from 'rxjs/operators'
import {
	Keystore,
	KeystoreT,
	PublicKeyT,
	SignatureT,
	HDPathRadix,
	HDPathRadixT,
	Int32,
	HDMasterSeed,
	MnemomicT,
	Mnemonic,
} from '@radixdlt/crypto'
import { Option } from 'prelude-ts'
import { arraysEqual, log, msgFromError } from '@radixdlt/util'
import { err, errAsync, ok, okAsync, Result, ResultAsync } from 'neverthrow'
import { HardwareSigningKeyT, HardwareWalletT } from '@radixdlt/hardware-wallet'
import { BuiltTransactionReadyToSign } from '@radixdlt/primitives'

type MutableSigningKeysT = SigningKeysT &
	Readonly<{
		add: (signingKey: SigningKeyT) => void
	}>

const createSigningKeys = (_all: SigningKeyT[]): MutableSigningKeysT => {
	const all: SigningKeyT[] = []

	const getHDSigningKeyByHDPath = (
		hdPath: HDPathRadixT,
	): Option<SigningKeyT> => {
		const signingKey = all
			.find(a => a.hdPath!.equals(hdPath))
		return Option.of(signingKey)
	}

	const getAnySigningKeyByPublicKey = (
		publicKey: PublicKeyT,
	): Option<SigningKeyT> => {
		const signingKey = all.find(a => a.publicKey.equals(publicKey))
		return Option.of(signingKey)
	}

	const add = (signingKey: SigningKeyT): void => {
		if (
			all.find(a => a.equals(signingKey)) !==
			undefined
		) {
			// already there
			return
		}
		// new
		all.push(signingKey)
	}

	const signingKeys: MutableSigningKeysT = {
		toString: (): string => {
			throw new Error('Overriden below')
		},
		all,
		add,
		size: () => all.length,
		getHDSigningKeyByHDPath,
		getAnySigningKeyByPublicKey,
	}

	return {
		...signingKeys,
	}
}

export const isSwitchToIndex = (
	something: unknown,
): something is SwitchToIndex => {
	const inspection = something as SwitchToIndex
	return inspection.toIndex !== undefined
}

const MutableSigningKeys = {
	create: createSigningKeys,
}

const create = (
	input: Readonly<{
		mnemonic: MnemomicT
		startWithInitialSigningKey?: boolean
	}>,
) => {
	const { mnemonic } = input
	const startWithInitialSigningKey = input.startWithInitialSigningKey ?? true
	const masterSeed = HDMasterSeed.fromMnemonic({ mnemonic })

	let unsafeActiveSigningKey: SigningKeyT = (undefined as unknown) as SigningKeyT
	const activeSigningKeySubject = new ReplaySubject<SigningKeyT>()
	const setActiveSigningKey = (newSigningKey: SigningKeyT): void => {
		activeSigningKeySubject.next(newSigningKey)
		unsafeActiveSigningKey = newSigningKey
	}

	const signingKeysSubject = new BehaviorSubject<MutableSigningKeysT>(
		MutableSigningKeys.create([]),
	)

	const revealMnemonic = (): MnemomicT => mnemonic

	const numberOfAllSigningKeys = (): number =>
		signingKeysSubject.getValue().size()

	const _addAndMaybeSwitchToNewSigningKey = (
		newSigningKey: SigningKeyT,
		alsoSwitchTo?: boolean,
	): SigningKeyT => {
		const alsoSwitchTo_ = alsoSwitchTo ?? false
		const signingKeys = signingKeysSubject.getValue()
		signingKeys.add(newSigningKey)
		signingKeysSubject.next(signingKeys)
		if (alsoSwitchTo_) {
			setActiveSigningKey(newSigningKey)
		}
		return newSigningKey
	}

	/*
	const deriveHWSigningKey = (
		keyDerivation: 'next' | HDPathRadixT,
		hardwareWalletConnection: ResultAsync<HardwareWalletT, Error>,
		alsoSwitchTo: boolean,
		verificationPrompt?: boolean,
	): ResultAsync<SigningKeyT, Error> => {
		const nextPath = (): HDPathRadixT => {
			const index = numberOfHWSigningKeys()
			return HDPathRadix.create({
				address: { index, isHardened: true },
			})
		}
		const hdPath: HDPathRadixT =
			keyDerivation === 'next' ? nextPath() : keyDerivation


		return hardwareWalletConnection.pipe(
			mergeMap(
				(
					hardwareWallet: HardwareWalletT,
				): Observable<HardwareSigningKeyT> =>
					hardwareWallet.makeSigningKey(
						hdPath,
						input.verificationPrompt,
					),
			),
			map((hardwareSigningKey: HardwareSigningKeyT) => {
				const signingKey = SigningKey.fromHDPathWithHWSigningKey({
					hdPath,
					hardwareSigningKey,
				})
				_addAndMaybeSwitchToNewSigningKey(
					signingKey,
					input.alsoSwitchTo,
				)
				return signingKey
			}),
		)
	}
	*/

	const _deriveLocalHDSigningKeyWithPath = (
		hdPath: HDPathRadixT,
		alsoSwitchTo: boolean = false
	): SigningKeyT =>
		_addAndMaybeSwitchToNewSigningKey(
			SigningKey.byDerivingNodeAtPath({
				hdPath,
				deriveNodeAtPath: () => masterSeed.masterNode().derive(hdPath),
			}),
			alsoSwitchTo,
		)

	const _deriveNextLocalHDSigningKeyAtIndex = (
		input: Readonly<{
			addressIndex: Readonly<{
				index: Int32
				isHardened?: boolean // defaults to true
			}>
			alsoSwitchTo?: boolean // defaults to false
		}>,
	): SigningKeyT =>
		_deriveLocalHDSigningKeyWithPath(
			HDPathRadix.create({
				address: input.addressIndex,
			}),
			input.alsoSwitchTo
		)
	
	const index = numberOfAllSigningKeys()

	const deriveNextLocalHDSigningKey = (
		isHardened: boolean = true,
		alsoSwitchTo: boolean = false,
	): SigningKeyT => {
		return _deriveNextLocalHDSigningKeyAtIndex({
			addressIndex: {
				index,
				isHardened,
			},
			alsoSwitchTo,
		})
	}

	const switchSigningKey = (input: SwitchSigningKeyInput): SigningKeyT => {
		const isSwitchToSigningKey = (
			something: unknown,
		): something is SwitchToSigningKey => {
			const inspection = input as SwitchToSigningKey
			return (
				inspection.toSigningKey !== undefined &&
				isSigningKey(inspection.toSigningKey)
			)
		}

		if (input === 'last') {
			const lastIndex = numberOfAllSigningKeys() - 1
			return switchSigningKey({ toIndex: lastIndex })
		} else if (input === 'first') {
			return switchSigningKey({ toIndex: 0 })
		} else if (isSwitchToSigningKey(input)) {
			const toSigningKey = input.toSigningKey
			setActiveSigningKey(toSigningKey)
			log.info(
				`Active signingKey switched to: ${toSigningKey.toString()}`,
			)
			return toSigningKey
		} else if (isSwitchToIndex(input)) {
			const unsafeTargetIndex = input.toIndex
			const signingKeys = signingKeysSubject.getValue()

			const safeTargetIndex = Math.min(
				unsafeTargetIndex,
				signingKeys.size(),
			)

			const firstSigningKey = Array.from(signingKeys.all)[safeTargetIndex]
			if (!firstSigningKey) {
				const err = `No signingKeys.`
				log.error(err)
				throw new Error(err)
			}
			return switchSigningKey({ toSigningKey: firstSigningKey })
		} else {
			const err = `Incorrect implementation, failed to type check 'input' of switchSigningKey. Probably is 'isSigningKey' typeguard wrong.`
			log.error(err)
			throw new Error(err)
		}
	}

	if (startWithInitialSigningKey) deriveNextLocalHDSigningKey(true, true)

	const activeSigningKey$ = activeSigningKeySubject.asObservable()

	const signingKeys$ = signingKeysSubject.asObservable().pipe(shareReplay())

	const restoreLocalHDSigningKeysUpToIndex = (
		index: number,
	): ResultAsync<SigningKeysT, Error> => {
		if (index < 0) return errAsync(Error('targetIndex must not be negative'))

		const localHDSigningKeysSize = numberOfAllSigningKeys()
		const numberOfSigningKeysToCreate = index - localHDSigningKeysSize

		Array(numberOfSigningKeysToCreate)
			.fill(undefined)
			.map((_, index) =>
				_deriveNextLocalHDSigningKeyAtIndex({
					addressIndex: { index: localHDSigningKeysSize + index },
				}),
			)

		const signingKeys: Promise<SigningKeysT> = firstValueFrom(signingKeys$)
		return ResultAsync.fromPromise(signingKeys, () => Error())
	}

	return {
		revealMnemonic,
		// should only be used for testing
		__unsafeGetSigningKey: (): SigningKeyT => unsafeActiveSigningKey,
		deriveNextLocalHDSigningKey,
		//deriveHWSigningKey,
		switchSigningKey,
		restoreLocalHDSigningKeysUpToIndex,
		observeSigningKeys: (): Observable<SigningKeysT> => signingKeys$,
		observeActiveSigningKey: (): Observable<SigningKeyT> =>
			activeSigningKey$,
		sign: (
			tx: BuiltTransactionReadyToSign,
			nonXrdHRP?: string,
		): ResultAsync<SignatureT, Error> => 
			ResultAsync.fromPromise(firstValueFrom(activeSigningKey$), e => e as Error).andThen(
				activeKey => activeKey.sign(Buffer.from(tx.hashOfBlobToSign, 'hex'))
			)
	}
}

const byLoadingAndDecryptingKeystore = (
	input: Readonly<{
		password: string
		load: () => Promise<KeystoreT>
		startWithInitialSigningKey?: boolean
	}>,
) => {
	const loadKeystore = (): ResultAsync<KeystoreT, Error> =>
		ResultAsync.fromPromise(input.load(), (e: unknown) => {
			const underlyingError = msgFromError(e)
			const errMsg = `Failed to load keystore, underlying error: '${underlyingError}'`
			log.error(errMsg)
			return new Error(errMsg)
		})
	return loadKeystore()
		.map((keystore: KeystoreT) => {
			log.info('Keystore successfully loaded.')
			return { ...input, keystore }
		})
		.andThen(SigningKeychain.fromKeystore)
}

const fromKeystore = (
	input: Readonly<{
		keystore: KeystoreT
		password: string
		startWithInitialSigningKey?: boolean
	}>,
) =>
	Keystore.decrypt(input)
		.map(entropy => ({ entropy }))
		.andThen(Mnemonic.fromEntropy)
		.map(mnemonic => ({
			mnemonic,
			startWithInitialSigningKey: input.startWithInitialSigningKey,
		}))
		.map(create)

const byEncryptingMnemonicAndSavingKeystore = (
	input: Readonly<{
		mnemonic: MnemomicT
		password: string
		save: (keystoreToSave: KeystoreT) => Promise<void>
		startWithInitialSigningKey?: boolean
	}>,
) => {
	const { mnemonic, password, startWithInitialSigningKey } = input

	const save = (keystoreToSave: KeystoreT): ResultAsync<KeystoreT, Error> =>
		ResultAsync.fromPromise(input.save(keystoreToSave), (e: unknown) => {
			const underlyingError = msgFromError(e)
			const errMsg = `Failed to save keystore, underlying error: '${underlyingError}'`
			log.error(errMsg)
			return new Error(errMsg)
		}).map(() => {
			log.info('Keystore successfully saved.')
			return keystoreToSave
		})

	return Keystore.encryptSecret({
		secret: mnemonic.entropy,
		password,
	})
		.andThen(save)
		.map((keystore: KeystoreT) => ({
			keystore,
			password,
			startWithInitialSigningKey,
		}))
		.andThen(SigningKeychain.fromKeystore)
}

export const SigningKeychain = {
	create,
	fromKeystore,
	byLoadingAndDecryptingKeystore,
	byEncryptingMnemonicAndSavingKeystore,
}
