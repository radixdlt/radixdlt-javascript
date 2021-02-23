import { BIP32 } from "../_index"

export type HDNodeT = Readonly<{
    // publicKey: Buffer
    // privateKey: Buffer
    // chainCode: Buffer
    derive: (path: BIP32) => HDNodeT
    // toJSON: () => Readonly<{ 
    //     xpriv: string
    //     xpub: string 
    // }>
}>

export type HDMasterSeedT = Readonly<{
    masterNode: () => HDNodeT
}>

export type MnemomicT = Readonly<{
    entropy: number
    words: string[]
}>

