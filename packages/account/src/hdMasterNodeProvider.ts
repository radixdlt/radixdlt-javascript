import { ResultAsync } from "neverthrow";
import { HDMasterSeedT, MasterSeedProviderT } from "./_index";

const fromKeyStore = (keystore: KeystoreT): Result<MasterSeedProviderT, Error> => {
	return {
		decrypt: (password: string): ResultAsync<HDMasterSeedT, Error> => {

		}
	}
}


export const MasterSeedProvider = {
	fromKeyStore
}

