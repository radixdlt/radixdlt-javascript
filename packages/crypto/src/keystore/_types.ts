export type ScryptParams = Readonly<{

 	// "N", CPU/memory cost parameter, must be power of 2.
    costParameterN: number
    costParameterC: number

	// "r", blocksize
    blockSize: number

    // "p"
    parallelizationParameter: number

    // "dklen"
    lengthOfDerivedKey: number

    salt: string
}>

export type KeystoreT = Readonly<{
	address: string
  	crypto: Readonly<{
    	cipher: string
    	cipherparams: Readonly<{
      		iv: string;
   		}>
    	ciphertext: string
    	kdf: 'scrypt'
    	kdfparams: ScryptParams
    	mac: string
  	}>
  	id: string;
  	version: number
}>