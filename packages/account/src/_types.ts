import { DSONCodable, JSONEncodable } from '@radixdlt/data-formats'
import { Byte } from '@radixdlt/util'
import {
	PrivateKey,
	PublicKey,
	Signature,
	UnsignedMessage,
} from '@radixdlt/crypto'
import {
	Observable,
	of,
	BehaviorSubject,
	Subject,
} from 'rxjs'
import { mergeMap } from 'rxjs/operators'
import { Result, ResultAsync } from 'neverthrow'

export type Address = JSONEncodable &
	DSONCodable &
	Readonly<{
		publicKey: PublicKey
		magicByte: Byte
		toString: () => string
		equals: (other: Address) => boolean
	}>

export type AccountIdFromBIP32Path = Readonly<{
	type: 'AccountIdFromBIP32Path'
	accountIdString: string
}>
/// Case of private key present => can directly derive public key => hashit, used as accountId
export type AccountIdFromPublicKey = Readonly<{
	type: 'AccountIdFromPublicKey'
	accountIdString: string
}>
export type AccountID = AccountIdFromBIP32Path | AccountIdFromPublicKey

export type AccountT = Readonly<{
	accountId: () => AccountID
	derivePublicKey: () => Observable<PublicKey>
	sign: (unsignedMessage: UnsignedMessage) => Observable<Signature>
}>

export const toObservable = <T, E = Error>(
	asyncResult: ResultAsync<T, E>,
): Observable<T> => {
	return new Observable((subscriber) => {
		void asyncResult.then((res: Result<T, E>) => {
			res.match(
				(value: T) => {
					subscriber.next(value)
					subscriber.complete()
				},
				(e: E) => subscriber.error(e),
			)
		})
	})
}

export const accountFromPrivateKey = (privateKey: PrivateKey): AccountT => {
	const publicKey: PublicKey = privateKey.publicKey()
	const sign = (m: UnsignedMessage): Observable<Signature> =>
		toObservable(privateKey.sign(m))

	const accountId = (): AccountID => ({
		type: 'AccountIdFromPublicKey',
		accountIdString: publicKey.asData({ compressed: true }).toString(),
	})

	return {
		sign: sign,
		accountId: accountId,
		derivePublicKey: () => of(publicKey),
	}
}

export type AddressFromPublicKeyProvider = (
	publicKey: PublicKey,
) => Observable<Address>

export type AddressProvider = Readonly<{
	deriveAddress: () => Observable<Address>
}>

export type BIP32 = Readonly<{
	toString: () => string
}>

// export type HardwareWallet = AccountT & Readonly<{
// 	getHWWalletAppVersion: () => Observable<string>
// 	// derivePublicKey: (index: number) => Observable<PublicKey>
// 	// signHash: (hash: Buffer) => Observable<Signature>
// }>

export type HardwareWallet = Readonly<{
	derivePublicKey: (hdPath: BIP32) => Observable<PublicKey>
	sign: (
		input: Readonly<{
			unsignedMessage: UnsignedMessage
			hdPath: BIP32
		}>,
	) => Observable<Signature>
}>

export const accountFromHDPath = (
	input: Readonly<{
		hdPath: BIP32
		onHardwareWalletConnect: Observable<HardwareWallet>
	}>,
): AccountT => {
	const accountId = (): AccountID => ({
		type: 'AccountIdFromBIP32Path',
		accountIdString: input.hdPath.toString(),
	})

	const hwObs = input.onHardwareWalletConnect

	return {
		sign: (unsignedMessage: UnsignedMessage): Observable<Signature> =>
			hwObs.pipe(
				mergeMap((hw: HardwareWallet) =>
					hw.sign({ unsignedMessage, hdPath: input.hdPath }),
				),
			),
		accountId: accountId,
		derivePublicKey: (): Observable<PublicKey> =>
			hwObs.pipe(
				mergeMap((hw: HardwareWallet) =>
					hw.derivePublicKey(input.hdPath),
				),
			),
	}
}

export type WalletT /* AccountT & */ = Readonly<{
	changeAccount: (to: AccountT) => void
	addAccount: (newAccount: AccountT) => void
	addAccountByPrivateKey: (privateKey: PrivateKey) => void
	observeActiveAccount: () => Observable<AccountT>
	observeAccounts: () => Observable<Map<AccountID, AccountT>>
}>

export const wallet = (
	input: Readonly<{
		accounts: Set<AccountT>
		addressFromPublicKeyProvider: AddressFromPublicKeyProvider
	}>,
): WalletT => {
	const accounts = Array.from(input.accounts)
	const activeAccountSubject = new Subject<AccountT>()

	const accountsSubject = new BehaviorSubject<Map<AccountID, AccountT>>(
		accounts.reduce((acc: Map<AccountID, AccountT>, curr: AccountT) => {
			acc.set(curr.accountId(), curr)
			return acc
		}, new Map<AccountID, AccountT>()),
	)

	const addAccount = (newAccount: AccountT): void => {
		const accountsMap = accountsSubject.getValue()
		if (accountsMap.has(newAccount.accountId())) {
			// Skip and don't falsly notify 'accountsSubject' about new account, since it is not new.
			return
		}
		accountsMap.set(newAccount.accountId(), newAccount)
		accountsSubject.next(accountsMap)
	}

	const changeAccount = (to: AccountT): void => {
		if (!accountsSubject.getValue().has(to.accountId())) {
			addAccount(to)
		}
		activeAccountSubject.next(to)
	}

	return {
		changeAccount: changeAccount,
		addAccountByPrivateKey: (pk) => addAccount(accountFromPrivateKey(pk)),
		addAccount: addAccount,
		observeActiveAccount: () => activeAccountSubject.asObservable(),
		observeAccounts: () => accountsSubject.asObservable(),
	}
}
