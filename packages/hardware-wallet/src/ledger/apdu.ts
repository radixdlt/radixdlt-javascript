import { RadixAPDUT, radixCLA } from './_types'
import { HDPathRadixT, RADIX_COIN_TYPE } from '@radixdlt/account'
import { LedgerInstruction } from '../_types'
import { BIP32PathComponentT } from '@radixdlt/account/dist/bip32/_types'

// ##### Follows https://github.com/radixdlt/radixdlt-ledger-app/blob/main/APDUSPEC.md #####

const hdPathToBuffer = (hdPath: HDPathRadixT): Buffer => {
	if (hdPath.purpose.value() !== 44 || !hdPath.purpose.isHardened) {
		throw new Error(`Expected purpose to be 44'`)
	}

	if (
		hdPath.coinType.value() !== RADIX_COIN_TYPE ||
		!hdPath.purpose.isHardened
	) {
		throw new Error(`Expected coinType to be ${RADIX_COIN_TYPE}'`)
	}

	const data = Buffer.alloc(12)

	const write = (
		pathComponent: BIP32PathComponentT,
		offset: number,
	): void => {
		data.writeInt32BE(pathComponent.value(), offset)
	}

	write(hdPath.account, 0)
	write(hdPath.change, 4)
	write(hdPath.addressIndex, 8)

	return data
}

const makeAPDU = (input: Omit<RadixAPDUT, 'cla'>): RadixAPDUT => {
	return {
		...input,
		cla: radixCLA,
	}
}

const getPublicKey = (
	input: Readonly<{
		hdPath: HDPathRadixT

		// defaults to 'false' (convenient for testing)
		requireConfirmationOnDevice?: boolean
	}>,
): RadixAPDUT => {
	const p1: number = input.requireConfirmationOnDevice ? 0x01 : 0x00

	const data = hdPathToBuffer(input.hdPath)

	return makeAPDU({
		ins: LedgerInstruction.GET_PUBLIC_KEY,
		p1,
		data,
	})
}

export const RadixAPDU = {
	getPublicKey,
}
