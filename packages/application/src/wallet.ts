import {
	SigningKeychainT,
	NetworkT,
	SigningKeyT,
	SigningKeysT,
	Acc0untAddressT,
	DeriveNextInput,
	Acc0untAddress,
	HDPathRadixT,
} from '@radixdlt/account'
import {
	WalletT,
	AccountT,
	IdentitiesT,
	SwitchIdentityInput,
	SwitchToIdentity,
	AddIdentityByPrivateKeyInput,
} from './_types'
import { Observable, of } from 'rxjs'
import { Account, isIdentity } from './account'
import { map } from 'rxjs/operators'
import { Option } from 'prelude-ts'
import { PublicKey } from '@radixdlt/crypto'

const create = (
	input: Readonly<{
		signingKeychain: SigningKeychainT
		network: NetworkT
	}>,
): WalletT => {
	const { network, signingKeychain } = input
	const aToAddr = (signingKey: SigningKeyT): Acc0untAddressT =>
		Acc0untAddress.fromPublicKeyAndNetwork({
			network,
			publicKey: signingKey.publicKey,
		})

	const aToI = (signingKey: SigningKeyT): AccountT =>
		Account.create({ signingKey, accountAddress: aToAddr(signingKey) })

	const asToIs = (accounts: SigningKeysT): IdentitiesT => {
		const getIdentityWithHDSigningKeyByHDPath = (
			hdPath: HDPathRadixT,
		): Option<AccountT> => {
			return accounts.getHDSigningKeyByHDPath(hdPath).map(aToI)
		}

		const getAnyIdentityByPublicKey = (
			publicKey: PublicKey,
		): Option<AccountT> => {
			return accounts.getAnySigningKeyByPublicKey(publicKey).map(aToI)
		}

		const all = accounts.all.map(aToI)

		return {
			all,
			getIdentityWithHDSigningKeyByHDPath,
			getAnyIdentityByPublicKey,
			identitiesWithHDSigningKeys: () => accounts.hdSigningKeys().map(aToI),
			identitiesWithHardwareHDSigningKeys: () =>
				accounts.hardwareHDSigningKeys().map(aToI),
			identitiesWithLocalHDSigningKeys: () =>
				accounts.localHDSigningKeys().map(aToI),
			identitiesWithNonHDSigningKeys: () =>
				accounts.nonHDSigningKeys().map(aToI),
			size: () => all.length,
		}
	}

	return {
		__unsafeGetIdentity: (): AccountT => {
			return aToI(signingKeychain.__unsafeGetSigningKey())
		},

		revealMnemonic: signingKeychain.revealMnemonic,

		deriveNextLocalHDIdentity: (
			input?: DeriveNextInput,
		): Observable<AccountT> => {
			return signingKeychain.deriveNextLocalHDSigningKey(input).pipe(map(aToI))
		},

		observeActiveIdentity: (): Observable<AccountT> => {
			return signingKeychain.observeActiveSigningKey().pipe(map(aToI))
		},

		observeIdentities: (): Observable<IdentitiesT> => {
			return signingKeychain.observeSigningKeys().pipe(map(asToIs))
		},

		addIdentityFromPrivateKey: (
			input: AddIdentityByPrivateKeyInput,
		): Observable<AccountT> => {
			return of(aToI(signingKeychain.addSigningKeyFromPrivateKey(input)))
		},

		restoreIdentitiesForLocalHDSigningKeysUpToIndex: (
			index: number,
		): Observable<IdentitiesT> => {
			return signingKeychain
				.restoreLocalHDSigningKeysUpToIndex(index)
				.pipe(map(asToIs))
		},

		switchIdentity: (input: SwitchIdentityInput): AccountT => {
			const isSwitchToIdentity = (
				something: unknown,
			): something is SwitchToIdentity => {
				const inspection = input as SwitchToIdentity
				return (
					inspection.toIdentity !== undefined &&
					isIdentity(inspection.toIdentity)
				)
			}

			if (isSwitchToIdentity(input)) {
				return aToI(
					signingKeychain.switchSigningKey({
						toSigningKey: input.toIdentity.signingKey,
					}),
				)
			} else {
				return aToI(signingKeychain.switchSigningKey(input))
			}
		},
	}
}

export const Wallet = {
	create,
}
