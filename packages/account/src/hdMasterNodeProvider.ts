import { KeystoreT, Keystore } from '@radixdlt/crypto'
import { Observable } from 'rxjs'
import { MasterSeedProviderT } from './_types'
import { HDMasterSeed, HDMasterSeedT } from './bip39/_index'
import { toObservable } from './resultAsync_observable'

const withKeyStore = (
	input: Readonly<{
		keystore: KeystoreT
		password: string
	}>,
): MasterSeedProviderT => {
	return {
		masterSeed: (): Observable<HDMasterSeedT> =>
			toObservable(Keystore.decrypt(input).map(HDMasterSeed.fromSeed)),
	}
}

export const MasterSeedProvider = {
	withKeyStore,
}
