import { PartialAPDUT, RadixAPDUT, radixCLA } from './_types'
import { HDPathRadixT, RADIX_COIN_TYPE } from '@radixdlt/account'
import { LedgerInstruction, LedgerResponseCodes } from '../_types'
import { BIP32PathComponentT } from '@radixdlt/account'
import { PublicKeyT } from '@radixdlt/crypto'

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

const makeAPDU = (input: Omit<PartialAPDUT, 'cla'>): RadixAPDUT => {
	return {
		cla: radixCLA,
		ins: input.ins,
		p1: input.p1 ?? 0,
		p2: input.p2 ?? 0,
		data: input.data,
		requiredResponseStatusCodeFromDevice: input.requiredResponseStatusCodeFromDevice ?? [
			LedgerResponseCodes.SW_OK,
		],
	}
}

const getVersion = (): RadixAPDUT =>
	makeAPDU({
		ins: LedgerInstruction.GET_VERSION,
	})

type WithPath = Readonly<{
	path: HDPathRadixT
}>

type APDUGetPublicKeyInput = WithPath &
	Readonly<{
		requireConfirmationOnDevice: boolean
	}>

const getPublicKey = (input: APDUGetPublicKeyInput): RadixAPDUT => {
	const p1: number = input.requireConfirmationOnDevice ? 0x01 : 0x00

	const data = hdPathToBuffer(input.path)

	return makeAPDU({
		ins: LedgerInstruction.GET_PUBLIC_KEY,
		p1,
		data,
	})
}

type APDUDoKeyExchangeInput = APDUGetPublicKeyInput &
	Readonly<{
		publicKeyOfOtherParty: PublicKeyT
	}>

const doKeyExchange = (input: APDUDoKeyExchangeInput): RadixAPDUT => {
	const p1: number = input.requireConfirmationOnDevice ? 0x01 : 0x00

	const publicKeyData = input.publicKeyOfOtherParty.asData({
		compressed: false,
	})
	const pathData = hdPathToBuffer(input.path)
	const data = Buffer.concat([pathData, publicKeyData])

	return makeAPDU({
		ins: LedgerInstruction.DO_KEY_EXCHANGE,
		p1,
		data,
	})
}

type APDUDoSignHashInput = APDUGetPublicKeyInput &
	Readonly<{
		hashToSign: Buffer
	}>

const doSignHash = (input: APDUDoSignHashInput): RadixAPDUT => {
	const p1: number = input.requireConfirmationOnDevice ? 0x01 : 0x00

	const pathData = hdPathToBuffer(input.path)
	const data = Buffer.concat([pathData, input.hashToSign])

	return makeAPDU({
		ins: LedgerInstruction.DO_SIGN_HASH,
		p1,
		data,
	})
}

export const RadixAPDU = {
	getVersion,
	getPublicKey,
	doKeyExchange,
	doSignHash,
}