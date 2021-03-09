import { Result } from 'neverthrow'
import { Observable } from 'rxjs'
import { HDMasterSeedT, MasterSeedProviderT } from './_types'

const fromKeyStore = (
	keystore: KeystoreT,
): Result<MasterSeedProviderT, Error> => {
	return {
		decrypt: (password: string): Observable<HDMasterSeedT> => {},
	}
}

export const MasterSeedProvider = {
	fromKeyStore,
}
