import { UInt256 } from '@radixdlt/uint256'

export type AmountT = UInt256

export enum NetworkT {
	MAINNET = 'MAINNET',
	BETANET = 'BETANET',
}

export type BuiltTransactionReadyToSign = Readonly<{
	// Bytes on hex format
	blob: string
	hashOfBlobToSign: string
}>
