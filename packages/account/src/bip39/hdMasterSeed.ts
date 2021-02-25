import { HDMasterSeedT, HDNodeT, MnemomicT } from './_types'
import { mnemonicToSeedSync } from 'bip39'
import HDNodeThirdParty = require('hdkey')
import { BIP32T } from '../bip32/_types'
import { privateKeyFromBuffer } from '@radixdlt/crypto'

const hdNodeFromHDNodeThirdParty = (
	hdNodeThirdParty: HDNodeThirdParty,
): HDNodeT => {
	const privateKeyResult = privateKeyFromBuffer(hdNodeThirdParty.privateKey)
	if (privateKeyResult.isErr())
		throw new Error(
			`Incorrect implementation, failed to get private key from HDNode, third party lib 'hdkey' might be buggy?`,
		)
	const privateKey = privateKeyResult.value

	return {
		privateKey,
		publicKey: privateKey.publicKey(),
		chainCode: hdNodeThirdParty.chainCode,
		derive: (path: BIP32T): HDNodeT =>
			hdNodeFromHDNodeThirdParty(
				hdNodeThirdParty.derive(path.toString()),
			),
		toJSON: () => hdNodeThirdParty.toJSON(),
	}
}

const from = (
	input: Readonly<{
		mnemonic: MnemomicT
		passphrase?: string
	}>,
): HDMasterSeedT => {
	const seed = mnemonicToSeedSync(input.mnemonic.phrase, input.passphrase)

	const hdNodeMaster = HDNodeThirdParty.fromMasterSeed(seed)

	return {
		entropy: input.mnemonic.entropy,
		seed,
		masterNode: (): HDNodeT => hdNodeFromHDNodeThirdParty(hdNodeMaster),
	}
}

export const HDMasterSeed = {
	from,
}
