import { HDMasterSeedT, MnemomicT } from "./_types"
import { mnemonicToSeed } from 'bip39'
import HDNode = require('hdkey')

const from = (input: Readonly<{
    mnemonic: MnemomicT,
    passphrase?: string
}>): HDMasterSeedT => {
    throw new Error('impl me')
}

export const HDMasterSeed = {
    from,
}