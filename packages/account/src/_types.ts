import { DSONCodable, JSONEncodable } from '@radixdlt/data-formats'
import { Byte } from '@radixdlt/util'
import { PublicKey } from '@radixdlt/crypto'

export type Address = JSONEncodable &
	DSONCodable &
	Readonly<{
		publicKey: PublicKey
		magicByte: Byte
		toString: () => string
		equals: (other: Address) => boolean
	}>

export type AccountID = string

// export type AddressProvider = Readonly<{
// 	deriveAddress: () => ResultAsync<Address, Error>
// }>
// export type AccountT = Signer &
// 	PublicKeyProvider &
// 	AddressProvider &
// 	Readonly<{
// 		accountId: () => AccountID
// 	}>
//
// export type WalletT = AccountT &
// 	Readonly<{
// 		acctiveAccountID: AccountID
// 		activeAccount: () => AccountT
// 		changeAccount: (to: AccountT) => AccountT
// 		changeAccountByID: (to: AccountID) => Result<AccountT, Error>
// 		accounts: Map<AccountID, AccountT>
// 	}>
//
// export const wallet = (account: AccountT): WalletT => {
// 	const activeAccountId = account.accountId()
// 	return {}
// }
