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

	const path = HDPathRadix.fromString(`m/44'/536'/2'/1/3`)._unsafeUnwrap()

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
						'3044022078b0d2d17d227a8dd14ecdf0d7d65580ac6c17ab980c50074e6c096c4081313202207a9819ceedab3bfd3d22452224394d6cb41e3441f4675a5e7bf58f059fdf34cd',
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
					`m/44'/536'/2'/1/3`,
				)._unsafeUnwrap(),
				publicKeyOfOtherParty,
				displayBIPAndPubKeyOtherParty,
			})
			.subscribe(
				(ecPointOnCurve: ECPointOnCurveT) => {
					expect(ecPointOnCurve.toString()).toBe(
						'6d5e07cfde5df84b5ef884b629d28d15b0f6c66be229680699767cd57c6182883fa2aff69be05f792a02d6ef657240b17c44614a53e45dff4c529bfb012b9646',
					)
					onResponse(ecPointOnCurve)
				},
				e => {
					throw e
				},
			),
	)
}
