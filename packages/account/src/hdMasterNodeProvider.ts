import { Result } from 'neverthrow'
import { KeystoreT, Keystore } from '@radixdlt/crypto'
import { Observable } from 'rxjs'
import { MasterSeedProviderT } from './_types'
import { HDMasterSeed, HDMasterSeedT } from './bip39/_index'

const withKeyStore = (
	input: Readonly<{
		keystore: KeystoreT
		password: string
	}>,
): MasterSeedProviderT => {
	return {
		masterSeed: (): Observable<HDMasterSeedT> =>
			new Observable((subscriber) => {
				Keystore.decrypt(input)
					.map(HDMasterSeed.fromSeed)
					.match(
						(hdMasterSeed) => {
							subscriber.next(hdMasterSeed)
							subscriber.complete()
						},
						(err) => {
							subscriber.error(err)
						},
					)
			}),
	}
}

export const MasterSeedProvider = {
	withKeyStore,
}
