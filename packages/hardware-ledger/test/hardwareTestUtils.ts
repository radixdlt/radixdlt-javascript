import { HardwareWalletT, SemVerT } from '@radixdlt/hardware-wallet'
import { Subscription } from 'rxjs'
import {
	ECPointOnCurveT,
	HDPathRadix,
	PublicKey,
	PublicKeyT,
	sha256Twice,
	SignatureT,
} from '@radixdlt/crypto'
import { NetworkT } from '@radixdlt/primitives'
import { AccountAddress } from '@radixdlt/account'

export const testGetVersion = (
	input: Readonly<{
		hardwareWallet: HardwareWalletT
		onResponse?: (version: SemVerT) => void
	}>,
): void => {
	const { hardwareWallet } = input
	const onResponse = input.onResponse ?? (_ => undefined)
	const subs = new Subscription()

	subs.add(
		hardwareWallet.getVersion().subscribe({
			next: (semVer: SemVerT) => {
				onResponse(semVer)
			},
			error: e => {
				throw e
			},
		}),
	)
}

export const testGetPublicKey = (
	input: Readonly<{
		hardwareWallet: HardwareWalletT
		requireConfirmationOnDevice?: boolean
		onResponse?: (publicKey: PublicKeyT) => void
	}>,
): void => {
	const { hardwareWallet } = input
	const onResponse = input.onResponse ?? (_ => undefined)
	const subs = new Subscription()

	const path = HDPathRadix.fromString(`m/44'/1022'/2'/1/3`)._unsafeUnwrap()
	const displayAddress = input.requireConfirmationOnDevice ?? false
	const expectedPubKeyHex =
		'03d79039c428a6b835e136fbb582e9259df23f8660f928367c3f0d6912728a8444'
	const expectedPubKey = PublicKey.fromBuffer(
		Buffer.from(expectedPubKeyHex, 'hex'),
	)._unsafeUnwrap()
	if (displayAddress) {
		console.log(`🔮 expected path: ${path.toString()}`)
		const accountAddress = AccountAddress.fromPublicKeyAndNetwork({
			publicKey: expectedPubKey,
			network: NetworkT.BETANET,
		})
		const wrongAccountAddress = AccountAddress.fromPublicKeyAndNetwork({
			publicKey: expectedPubKey,
			network: NetworkT.MAINNET,
		})
		console.log(
			`🔮 expected address: '${accountAddress.toString()}' ([wrong]mainnet: '${wrongAccountAddress.toString()}')`,
		)
	}

	subs.add(
		hardwareWallet
			.getPublicKey({
				// both Account and Address will be hardened.
				path,
				displayAddress,
				// verifyAddressOnDeviceForNetwork: NetworkT.BETANET,
			})
			.subscribe(
				(publicKey: PublicKeyT) => {
					expect(publicKey.toString(true)).toBe(expectedPubKeyHex)
					onResponse(publicKey)
				},
				e => {
					throw e
				},
			),
	)
}

export const testDoSignHash = (
	input: Readonly<{
		hardwareWallet: HardwareWalletT
		onResponse?: (signature: SignatureT) => void
	}>,
): void => {
	const { hardwareWallet } = input
	const onResponse = input.onResponse ?? (_ => undefined)
	const subs = new Subscription()

	const hashToSign = sha256Twice(`I'm testing Radix awesome hardware wallet!`)

	const path = HDPathRadix.fromString(`m/44'/1022'/2'/1/3`)._unsafeUnwrap()

	const displayAddress = true

	if (displayAddress) {
		console.log(`🔮 Path: ${path.toString()}`)
		console.log(`🔮 Hash: ${hashToSign.toString('hex')}`)
	}

	subs.add(
		hardwareWallet
			.doSignHash({
				path,
				hashToSign,
				displayAddress,
			})
			.subscribe(
				(signature: SignatureT) => {
					expect(signature.toDER()).toBe(
						'3045022100de5f8c5a92cc5bea386d7a5321d0aa1b46fc7d90c5d07098346252aacd59e52302202bbaeef1256d0185b550a7b661557eea11bb98b99ccc7e01d19fd931e617e824',
					)
					onResponse(signature)
				},
				e => {
					throw e
				},
			),
	)
}

export const testDoKeyExchange = (
	input: Readonly<{
		hardwareWallet: HardwareWalletT
		displayBIPAndPubKeyOtherParty?: boolean
		onResponse?: (ecPointOnCurve: ECPointOnCurveT) => void
	}>,
): void => {
	const { hardwareWallet } = input
	const onResponse = input.onResponse ?? (_ => undefined)
	const subs = new Subscription()

	const publicKeyOfOtherParty = PublicKey.fromBuffer(
		Buffer.from(
			'0479be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8',
			'hex',
		),
	)._unsafeUnwrap()

	const displayBIPAndPubKeyOtherParty =
		input?.displayBIPAndPubKeyOtherParty ?? false

	if (displayBIPAndPubKeyOtherParty) {
		console.log(
			`🔮 publicKeyOfOtherParty: ${publicKeyOfOtherParty.toString(
				false,
			)}`,
		)

		const accountAddressOfOtherParty = AccountAddress.fromPublicKeyAndNetwork(
			{
				publicKey: publicKeyOfOtherParty,
				network: NetworkT.BETANET,
			},
		)

		console.log(
			`🔮 other party address: ${accountAddressOfOtherParty.toString()}`,
		)
	}

	subs.add(
		hardwareWallet
			.doKeyExchange({
				// both Account and Address will be hardened.
				path: HDPathRadix.fromString(
					`m/44'/1022'/2'/1/3`,
				)._unsafeUnwrap(),
				publicKeyOfOtherParty,
				displayBIPAndPubKeyOtherParty,
			})
			.subscribe(
				(ecPointOnCurve: ECPointOnCurveT) => {
					expect(ecPointOnCurve.toString()).toBe(
						'd79039c428a6b835e136fbb582e9259df23f8660f928367c3f0d6912728a8444a87d3a07191942666ca3d0396374531fe669e451bae6eeb79fb0884ef78a2f9d',
					)
					onResponse(ecPointOnCurve)
				},
				e => {
					throw e
				},
			),
	)
}
