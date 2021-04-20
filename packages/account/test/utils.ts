import { PrivateKey, privateKeyFromScalar } from "@radixdlt/crypto"
import { UInt256 } from "@radixdlt/uint256"
import { HDPathRadixT, Mnemonic, Wallet, WalletT } from "../src"

export const makeWalletWithFunds = (): WalletT => {
	return Wallet.__unsafeCreateWithPrivateKeyProvider({
		mnemonic: Mnemonic.generateNew(), // not used,
		__privateKeyProvider: (hdPath: HDPathRadixT): PrivateKey => {
			const privateKeyScalar: number =
				(hdPath.addressIndex.value() % 10000) + 1 // `0` is not a valid key.
			return privateKeyFromScalar(
				UInt256.valueOf(privateKeyScalar),
			)._unsafeUnwrap()
		},
	})
}