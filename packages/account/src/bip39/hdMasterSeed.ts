import { HDMasterSeedT, HDNodeT, MnemomicT } from './_types'
import { mnemonicToSeedSync } from 'bip39'
import HDNodeThirdParty = require('hdkey')
import { BIP32T } from '../bip32/_types'
import { privateKeyFromBuffer } from '@radixdlt/crypto'
import { Result, err, ok } from 'neverthrow'

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

const fromMnemonic = (
	input: Readonly<{
		mnemonic: MnemomicT
		passphrase?: string
	}>,
): HDMasterSeedT => {
	const seed = mnemonicToSeedSync(input.mnemonic.phrase, input.passphrase)
	return fromSeed(seed)
}

const fromSeed = (seed: Buffer): HDMasterSeedT => {
	const hdNodeMaster = HDNodeThirdParty.fromMasterSeed(seed)

	return {
		seed,
		masterNode: (): HDNodeT => hdNodeFromHDNodeThirdParty(hdNodeMaster),
	}
}

export const HDMasterSeed = {
	fromMnemonic,
	fromSeed,
}

const fromExtendedPrivateKey = (xpriv: string): Result<HDNodeT, Error> => {
	try {
		const hdKey = HDNodeThirdParty.fromJSON({ xpriv, xpub: 'not used' })
		console.log(
			`🔮 hdkey.xpriv: ${hdKey.toJSON().xpriv}, passed in: ${xpriv}`,
		)
		return ok(hdNodeFromHDNodeThirdParty(hdKey))
	} catch {
		return err(
			new Error('Failed to create HDNode from extended private key'),
		)
	}
}

export const HDNode = {
	fromExtendedPrivateKey,
}
