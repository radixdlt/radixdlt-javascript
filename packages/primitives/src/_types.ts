import { UInt256 } from '@radixdlt/uint256'

export type AmountT = UInt256

export enum Network {
	MAINNET = 'MAINNET',
	STOKENET = 'STOKENET',
	TESTNET3 = 'TESTNET3',
	TESTNET4 = 'TESTNET4',
	TESTNET5 = 'TESTNET5',
	TESTNET6 = 'TESTNET6',
	TESTNET7 = 'TESTNET7',
}

export const NetworkId = {
	1: Network.MAINNET,
	2: Network.STOKENET,
	3: Network.TESTNET3,
	4: Network.TESTNET4,
	5: Network.TESTNET5,
	6: Network.TESTNET6,
	7: Network.TESTNET7,
}

export const NetworkName = {
	mainnet: Network.MAINNET
}

export const hrpFullSuffixLength = 3

export const HRP = {
	[Network.MAINNET]: {
		account: 'rdx',
		validator: 'rv',
		RRI_suffix: '_rr',
	},
	[Network.STOKENET]: {
		account: 'tdx',
		validator: 'tv',
		RRI_suffix: '_tr',
	},
	[Network.TESTNET3]: {
		account: 'tdx3',
		validator: 'tv3',
		RRI_suffix: '_tr3',
	},
	[Network.TESTNET4]: {
		account: 'tdx4',
		validator: 'tv4',
		RRI_suffix: '_tr4',
	},
	[Network.TESTNET5]: {
		account: 'tdx5',
		validator: 'tv5',
		RRI_suffix: '_tr5',
	},
	[Network.TESTNET6]: {
		account: 'tdx6',
		validator: 'tv6',
		RRI_suffix: '_tr6',
	},
	[Network.TESTNET7]: {
		account: 'tdx7',
		validator: 'tv7',
		RRI_suffix: '_tr7',
	},
}

export type BuiltTransactionReadyToSign = Readonly<{
	// Bytes on hex format
	blob: string
	hashOfBlobToSign: string
}>
