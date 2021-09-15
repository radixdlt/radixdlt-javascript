import { UInt256 } from '@radixdlt/uint256'

export type AmountT = UInt256

export type Network = 'MAINNET' | 'STOKENET' | `TESTNET${number}`

export const network = (id: number): Network =>
	id === 1 ? 'MAINNET' :
	id === 2 ? 'STOKENET' :
	`TESTNET${id}`

export const hrpFullSuffixLength = 3

export type AccountHRP = 'rdx' | 'tdx' | `tdx${number}`
export type ValidatorHRP = 'rv' | 'tv' | `tv${number}`
export type RRIHRP = '_rr' | '_tr' | `_tr${number}`

export const HRP = (network: Network) => (
	(values: [AccountHRP, ValidatorHRP, RRIHRP]) => ({
		account: values[0],
		validator: values[1],
		RRI_suffix: values[2]
	})
)(
	network === 'MAINNET' ? ['rdx', 'rv', '_rr'] :
	network === 'STOKENET' ? ['tdx', 'tv', '_tr'] :
	((id: number): [`tdx${number}`, `tv${number}`, `_tr${number}`] =>
		 [`tdx${id}`, `tv${id}`, `_tr${id}`])(parseInt(network.split('TESTNET')[1]))
)

export type BuiltTransactionReadyToSign = Readonly<{
	// Bytes on hex format
	blob: string
	hashOfBlobToSign: string
}>