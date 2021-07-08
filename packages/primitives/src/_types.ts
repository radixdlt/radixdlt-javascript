import { UInt256 } from '@radixdlt/uint256'

export type AmountT = UInt256

export enum Network {
	MAINNET = 'MAINNET',
	STOKENET = 'STOKENET',
	TESTNET3 = 'TESTNET3',
	TESTNET4 = 'TESTNET4',
	TESTNET5 = 'TESTNET5',
}

export const hrpFullSuffixLength = 3

export const HRP = {
	[Network.MAINNET]: {
		account: 'rdx',
		validator: 'vr',
		RRI_suffix: '_rr',
	},
	[Network.STOKENET]: {
		account: 'trx',
		validator: 'vt',
		RRI_suffix: '_tr',
	},
	[Network.TESTNET3]: {
		account: 'trx3',
		validator: 'vt3',
		RRI_suffix: '_tr3',
	},
	[Network.TESTNET4]: {
		account: 'trx4',
		validator: 'vt4',
		RRI_suffix: '_tr4',
	},
	[Network.TESTNET5]: {
		account: 'trx5',
		validator: 'vt5',
		RRI_suffix: '_tr5',
	},
}

export type BuiltTransactionReadyToSign = Readonly<{
	// Bytes on hex format
	blob: string
	hashOfBlobToSign: string
}>
