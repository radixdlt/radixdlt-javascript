import { ResultAsync } from "neverthrow"
import { KeystoreT, ScryptParams } from "./_types"


const decryptKeystore = (keystore: KeystoreT, password: string): ResultAsync<Buffer, Error> => {
	const ciphertext = Buffer.from(keystore.crypto.ciphertext, 'hex')
	const iv = Buffer.from(keystore.crypto.cipherparams.iv, 'hex')
	const kdfparams = keystore.crypto.kdfparams;

	const derivedKeyRes = await getDerivedKey({
    	key: Buffer.from(password),
	    kdf: keystore.crypto.kdf,
	    params: kdfparams,
	})

	return derivedKeyRes.andThen((derivedKey) => {
		const hmac = createHmac('sha256', derivedKey)
	    hmac.update(
	    	Buffer.concat([
        		derivedKey.slice(16, 32),
        		ciphertext,
		        iv,
		        Buffer.from(AES_ALGORITHM),
		      ]),
      	'hex',
    	)
	    const mac = hmac.digest('hex')

	  	if (!bytes.isEqual(mac.toUpperCase(), keystore.crypto.mac.toUpperCase())) {
    		return err(new Error('Failed to decrypt.'))
	  	}

  const cipher = new aes.ModeOfOperation.ctr(
    derivedKey.slice(0, 16),
    new aes.Counter(iv),
  );

  return Buffer.from(cipher.decrypt(ciphertext)).toString('hex');
	})
}

