import { UInt256 } from '@radixdlt/uint256'

export type AmountT = UInt256 & { toPrimitive: () => string }

export enum Network {
  MAINNET = 'mainnet',
  STOKENET = 'stokenet',
  LOCALNET = 'localnet',
  MILESTONENET = 'milestonenet',
  TESTNET3 = 'testnet3',
  TESTNET4 = 'testnet4',
  TESTNET6 = 'testnet6',
  SANDPITNET = 'sandpitnet',
}

export const NetworkId = {
  1: Network.MAINNET,
  2: Network.STOKENET,
  3: Network.TESTNET3,
  4: Network.TESTNET4,
  5: Network.MILESTONENET,
  6: Network.TESTNET6,
  7: Network.SANDPITNET,
  99: Network.LOCALNET,
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
  [Network.LOCALNET]: {
    account: 'ddx',
    validator: 'dv',
    RRI_suffix: '_dr',
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
  [Network.MILESTONENET]: {
    account: 'tdx5',
    validator: 'tv5',
    RRI_suffix: '_tr5',
  },
  [Network.TESTNET6]: {
    account: 'tdx6',
    validator: 'tv6',
    RRI_suffix: '_tr6',
  },
  [Network.SANDPITNET]: {
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
