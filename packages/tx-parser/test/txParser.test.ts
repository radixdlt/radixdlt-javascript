import { Transaction } from '../src/transaction'
import {
	Ins_HEADER,
	Ins_SYSCALL,
	InstructionType,
	StakeShareT,
	TransactionT,
} from '../src'
import {
	Ins_DOWN,
	Ins_END,
	Ins_LDOWN,
	Ins_SIG,
	Ins_UP,
	PreparedStakeT,
	PreparedUnstakeT,
	SubStateType,
	TokensT,
} from '../dist'

describe('txParser', () => {
	describe('complex tx with multiple substate groups', () => {
		it('really_plz_delete_me', () => {
			const doTest = (
				displayInstructionContentsOnLedgerDevice: boolean,
				displayTXSummaryOnLedgerDevice: boolean,
				expectedNumber: number,
			): void => {
				let p2 = 0b00000000

				if (displayInstructionContentsOnLedgerDevice) {
					const bitMask_displayInstructionContentsOnLedgerDevice =
						0b1 << 0
					p2 = p2 ^ bitMask_displayInstructionContentsOnLedgerDevice
				}

				if (displayTXSummaryOnLedgerDevice) {
					const bitMask_displayTXSummaryOnLedgerDevice = 0b1 << 1
					p2 = p2 ^ bitMask_displayTXSummaryOnLedgerDevice
				}

				expect(p2).toBe(expectedNumber)
			}

			doTest(false, false, 0)
			doTest(true, true, 3)

			doTest(true, false, 1)
			doTest(false, true, 2)
		})

		it('tokens transfer and stake', () => {
			const blobHex =
				'0a000104374c00efbe61f645a8b35d7746e106afa7422877e5d607975b6018e0a1aa6bf0000000040921000000000000000000000000000000000000000000000000000000000000000002010301040377bac8066e51cd0d6b320c338d5abbcdbcca25572b6b3eee9443eafc92106bba000000000000000000000000000000000000000000000001158e460913cffffe000500000003010301040377bac8066e51cd0d6b320c338d5abbcdbcca25572b6b3eee9443eafc92106bba0000000000000000000000000000000000000000000000008ac7230489e7fffe0104040377bac8066e51cd0d6b320c338d5abbcdbcca25572b6b3eee9443eafc92106bba02f19b2d095a553f3a41da4a8dc1f8453dfbdc733c5aece8b128b7d7999ae247a50000000000000000000000000000000000000000000000008ac7230489e80000000700dcb252005545207d4d0e0a72952acccf9466087fbecee7d5851467869aa8d6566dd9476f5e719fe1025dee78f975d9b5a5d136ced8e51cfcd7b7c85563edb23b'
			const blob = Buffer.from(blobHex, 'hex')
			const txRes = Transaction.fromBuffer(blob)
			if (txRes.isErr()) {
				throw txRes.error
			}
			const parsedTx: TransactionT = txRes.value
			console.log(parsedTx.toString())
			expect(parsedTx.toBuffer().toString('hex')).toBe(blobHex)

			const ins = parsedTx.instructions

			expect(ins.length).toBe(10)
			expect(
				ins.map(i => i.instructionType).map(it => InstructionType[it]),
			).toStrictEqual([
				'HEADER',
				'DOWN',
				'SYSCALL',
				'UP',
				'END',
				'LDOWN',
				'UP',
				'UP',
				'END',
				'SIG',
			])

			const i0_HEADER = ins[0] as Ins_HEADER
			expect(i0_HEADER.version).toBe(0x00)
			expect(i0_HEADER.flag).toBe(0x01)

			const i1_DOWN = ins[1] as Ins_DOWN
			expect(i1_DOWN.substateId.index).toBe(4)
			expect(i1_DOWN.substateId.hash.toString('hex')).toBe(
				'374c00efbe61f645a8b35d7746e106afa7422877e5d607975b6018e0a1aa6bf0',
			)

			const i2_SYSCALL = ins[2] as Ins_SYSCALL
			expect(i2_SYSCALL.callData.data.toString('hex')).toBe(
				'000000000000000000000000000000000000000000000000000000000000000002',
			)

			const i3_UP = ins[3] as Ins_UP
			expect(i3_UP.substate.substateType).toBe(SubStateType.TOKENS)
			const tokens0 = i3_UP.substate as TokensT
			expect(tokens0.amount.toString()).toBe('19999999999999999998')
			expect(tokens0.rri.toBuffer().readUInt8()).toBe(1)
			expect(tokens0.owner.toBuffer().toString('hex')).toBe(
				'040377bac8066e51cd0d6b320c338d5abbcdbcca25572b6b3eee9443eafc92106bba',
			)

			const i4_END = ins[4] as Ins_END

			const i5_LDOWN = ins[5] as Ins_LDOWN
			expect(i5_LDOWN.substateIndex.valueOf()).toBe(3)

			const i6_UP = ins[6] as Ins_UP
			expect(i6_UP.substate.substateType).toBe(SubStateType.TOKENS)
			const tokens1 = i6_UP.substate as TokensT
			expect(tokens1.amount.toString()).toBe('9999999999999999998')
			expect(tokens1.rri.toBuffer().readUInt8()).toBe(1)
			expect(tokens1.owner.toBuffer().toString('hex')).toBe(
				'040377bac8066e51cd0d6b320c338d5abbcdbcca25572b6b3eee9443eafc92106bba',
			)

			const i7_UP = ins[7] as Ins_UP
			expect(i7_UP.substate.substateType).toBe(
				SubStateType.PREPARED_STAKE,
			)
			const stake = i7_UP.substate as PreparedStakeT
			expect(stake.amount.toString()).toBe('10000000000000000000')
			expect(stake.delegate.toString(true)).toBe(
				'02f19b2d095a553f3a41da4a8dc1f8453dfbdc733c5aece8b128b7d7999ae247a5',
			)
			expect(stake.owner.toBuffer().toString('hex')).toBe(
				'040377bac8066e51cd0d6b320c338d5abbcdbcca25572b6b3eee9443eafc92106bba',
			)

			const i8_END = ins[8] as Ins_END

			const i9_SIG = ins[9] as Ins_SIG
			expect(i9_SIG.signature.toBuffer().toString('hex')).toBe(
				'00dcb252005545207d4d0e0a72952acccf9466087fbecee7d5851467869aa8d6566dd9476f5e719fe1025dee78f975d9b5a5d136ced8e51cfcd7b7c85563edb23b',
			)
		})

		// const testComplex = (
		// 	blobHex: string,
		// 	expected: {
		// 		instructionTypes: string[],
		// 		substateTypesInInsUP: SubStateType[],
		// 		signature: string,
		// 		txID: string
		// 	}
		// ): void => {
		// 	const blob = Buffer.from(blobHex, 'hex')
		// 	const txRes = Transaction.fromBuffer(blob)
		// 	if (txRes.isErr()) {
		// 		throw txRes.error
		// 	}
		// 	const parsedTx: TransactionT = txRes.value
		// 	console.log(`✅ parsed tx: ${parsedTx.toString()}`)
		// 	expect(parsedTx.toBuffer().toString('hex')).toBe(blobHex)
		//
		// 	const expIns = expected.instructionTypes
		//
		// 	const ins = parsedTx.instructions
		// 	expect(ins.length).toBe(expIns.length)
		//
		// 	expect(
		// 		ins.map(i => i.instructionType).map(it => InstructionType[it]),
		// 	).toStrictEqual(expIns)
		//
		// 	expect(
		// 		ins.filter(i => i.instructionType === InstructionType.UP).map(i => i as Ins_UP).map(upI => upI.substate.substateType),
		// 	).toStrictEqual(expected.substateTypesInInsUP)
		//
		// 	const insSIG = ins[ins.length - 1] as Ins_SIG
		// 	expect(insSIG.signature.toBuffer().toString('hex')).toBe(expected.signature)
		//
		// 	expect(parsedTx.txID()).toBe(expected.txID)
		// }

		const testComplex = (input: {
			blobHex: string
			expected: {
				parsedTX: string
				txID: string
			}
		}): void => {
			const { blobHex, expected } = input
			const blob = Buffer.from(blobHex, 'hex')
			const txRes = Transaction.fromBuffer(blob)
			if (txRes.isErr()) {
				throw txRes.error
			}
			const parsedTx: TransactionT = txRes.value
			console.log(parsedTx.toString())
			expect(parsedTx.toString()).toBe(expected.parsedTX)
			expect(parsedTx.txID()).toBe(expected.txID)
		}

		it('Fee_Stake_Transfer', () => {
			testComplex({
				blobHex:
					'045d375643dded796e8d3526dcae7a068c642e35fb9931688f56ea20b56289330f0000000309210000000000000000000000000000000000000000000000000000000000000000020103010402ed0eeaf54a79df88f12f251f22b88df00afaad43497f448620353a94e5c2e155000000000000000000000000000000000000000000000001158e460913cffffe0005000000020103010402ed0eeaf54a79df88f12f251f22b88df00afaad43497f448620353a94e5c2e1550000000000000000000000000000000000000000000000008ac7230489e7fffe01040402ed0eeaf54a79df88f12f251f22b88df00afaad43497f448620353a94e5c2e15502fd72e14bae5305db65f51d723e0a68a54a49dc85d0875b44d3cf1e80413de8870000000000000000000000000000000000000000000000008ac7230489e800000005000000050103010402ed0eeaf54a79df88f12f251f22b88df00afaad43497f448620353a94e5c2e1550000000000000000000000000000000000000000000000008ac7230489e7fffd01030104036b062b0044f412f30a973947e5e986629669d055b78fcfbb68a63211462ed0f700000000000000000000000000000000000000000000000000000000000000010007012953bf9f14bb362b84e84086571a56c4bc04c620cc07e50bac8592a22f39938a3cacb9d5a8833211cbce4e51ec0916b94c0c0438bbea1b772aecfd95a61c1d3e',
				expected: {
					parsedTX: `Instructions:
|- DOWN(SubstateId { hash: 0x5d375643dded796e8d3526dcae7a068c642e35fb9931688f56ea20b56289330f, index: 3 })
|- SYSCALL(0x000000000000000000000000000000000000000000000000000000000000000002)
|- UP(Tokens { rri: 0x01, owner: 0x0402ed0eeaf54a79df88f12f251f22b88df00afaad43497f448620353a94e5c2e155, amount: U256 { raw: 19999999999999999998 } })
|- END
|- LDOWN(2)
|- UP(Tokens { rri: 0x01, owner: 0x0402ed0eeaf54a79df88f12f251f22b88df00afaad43497f448620353a94e5c2e155, amount: U256 { raw: 9999999999999999998 } })
|- UP(PreparedStake { owner: 0x0402ed0eeaf54a79df88f12f251f22b88df00afaad43497f448620353a94e5c2e155, delegate: 0x02fd72e14bae5305db65f51d723e0a68a54a49dc85d0875b44d3cf1e80413de887, amount: U256 { raw: 10000000000000000000 } })
|- END
|- LDOWN(5)
|- UP(Tokens { rri: 0x01, owner: 0x0402ed0eeaf54a79df88f12f251f22b88df00afaad43497f448620353a94e5c2e155, amount: U256 { raw: 9999999999999999997 } })
|- UP(Tokens { rri: 0x01, owner: 0x04036b062b0044f412f30a973947e5e986629669d055b78fcfbb68a63211462ed0f7, amount: U256 { raw: 1 } })
|- END
|- SIG(0x012953bf9f14bb362b84e84086571a56c4bc04c620cc07e50bac8592a22f39938a3cacb9d5a8833211cbce4e51ec0916b94c0c0438bbea1b772aecfd95a61c1d3e)`,
					txID:
						'26c64c74a56863696e637f1efea710d39507cdf5a795a7dd645154a8c71d439f',
				},
			})
		})

		it('Fee_Transfer_Stake', () => {
			testComplex({
				blobHex:
					'04c1e268b8b61ce5688d039aefa1e5ea6612a6c4d3b497713582916b533d6c502800000003092100000000000000000000000000000000000000000000000000000000000000000201030104035c8522494136cab2c7445cd485a905338fa9191d0d3314cf0e3b60a792119f2b000000000000000000000000000000000000000000000001158e460913cffffe00050000000201030104035c8522494136cab2c7445cd485a905338fa9191d0d3314cf0e3b60a792119f2b000000000000000000000000000000000000000000000001158e460913cffffd01030104022c4f0832c24ebc6477005c397fa51e8de0710098b816d43a85332658c7a21411000000000000000000000000000000000000000000000000000000000000000100050000000501030104035c8522494136cab2c7445cd485a905338fa9191d0d3314cf0e3b60a792119f2b0000000000000000000000000000000000000000000000008ac7230489e7fffd010404035c8522494136cab2c7445cd485a905338fa9191d0d3314cf0e3b60a792119f2b037bf52ffd736eda6554b3b7b03eae3f9e2bd9b4b1c11e73355191403ff96961ac0000000000000000000000000000000000000000000000008ac7230489e800000007011d3deb32ffff0d1b6c34e29a18cc78a35b575550026bc40210b5744964e553cb26f25a4ee823195b18ba17694e644f93758d52a6d37f5990e0068c778ad66f6f',
				expected: {
					parsedTX: `Instructions:
|- DOWN(SubstateId { hash: 0xc1e268b8b61ce5688d039aefa1e5ea6612a6c4d3b497713582916b533d6c5028, index: 3 })
|- SYSCALL(0x000000000000000000000000000000000000000000000000000000000000000002)
|- UP(Tokens { rri: 0x01, owner: 0x04035c8522494136cab2c7445cd485a905338fa9191d0d3314cf0e3b60a792119f2b, amount: U256 { raw: 19999999999999999998 } })
|- END
|- LDOWN(2)
|- UP(Tokens { rri: 0x01, owner: 0x04035c8522494136cab2c7445cd485a905338fa9191d0d3314cf0e3b60a792119f2b, amount: U256 { raw: 19999999999999999997 } })
|- UP(Tokens { rri: 0x01, owner: 0x04022c4f0832c24ebc6477005c397fa51e8de0710098b816d43a85332658c7a21411, amount: U256 { raw: 1 } })
|- END
|- LDOWN(5)
|- UP(Tokens { rri: 0x01, owner: 0x04035c8522494136cab2c7445cd485a905338fa9191d0d3314cf0e3b60a792119f2b, amount: U256 { raw: 9999999999999999997 } })
|- UP(PreparedStake { owner: 0x04035c8522494136cab2c7445cd485a905338fa9191d0d3314cf0e3b60a792119f2b, delegate: 0x037bf52ffd736eda6554b3b7b03eae3f9e2bd9b4b1c11e73355191403ff96961ac, amount: U256 { raw: 10000000000000000000 } })
|- END
|- SIG(0x011d3deb32ffff0d1b6c34e29a18cc78a35b575550026bc40210b5744964e553cb26f25a4ee823195b18ba17694e644f93758d52a6d37f5990e0068c778ad66f6f)`,
					txID:
						'dd315ccecfe991fbfd6118a122c1b6c99d67094cba21028b94c81599049e7c9e',
				},
			})
		})

		it('Fee_Unstake_Transfer', () => {
			testComplex({
				blobHex:
					'0414f4235a478a63f7c17795bb482ed22efb8bcbe5239d3a5544f33b26f308747500000001092100000000000000000000000000000000000000000000000000000000000000000401030104033b8c4cfdf815828620bd5ed254225f2be4ecfcd1b7c72d096f385835ca1c8d700000000000000000000000000000000000000000000000008ac7230489e7fffc00045e01ca4385fe4ba31d3649ae7cc746446d46c4405064bf7c6d4faa853586eab700000007010d031fa3fe2db67d482ef3b3b6f6facf874cf1502af8a463d8ac75f378a09d78f01204033b8c4cfdf815828620bd5ed254225f2be4ecfcd1b7c72d096f385835ca1c8d700000000000000000000000000000000000000000000000008ac7230489e8000000050000000201030104033b8c4cfdf815828620bd5ed254225f2be4ecfcd1b7c72d096f385835ca1c8d700000000000000000000000000000000000000000000000008ac7230489e7fffb01030104039af69ffd4752e60d0f584f4ce39526dd855e1c35293473f683de09f6b19e4c960000000000000000000000000000000000000000000000000000000000000001000701d52f25d0690171b4d4cfc5e6df2415e395487b13e29fb71fc35617117e46d5bc2f5c0eb98495b350107143852badea414d34da674bccfda1639835b6a98ae35f',
				expected: {
					parsedTX: `Instructions:
|- DOWN(SubstateId { hash: 0x14f4235a478a63f7c17795bb482ed22efb8bcbe5239d3a5544f33b26f3087475, index: 1 })
|- SYSCALL(0x000000000000000000000000000000000000000000000000000000000000000004)
|- UP(Tokens { rri: 0x01, owner: 0x04033b8c4cfdf815828620bd5ed254225f2be4ecfcd1b7c72d096f385835ca1c8d70, amount: U256 { raw: 9999999999999999996 } })
|- END
|- DOWN(SubstateId { hash: 0x5e01ca4385fe4ba31d3649ae7cc746446d46c4405064bf7c6d4faa853586eab7, index: 7 })
|- UP(PreparedUnstake { delegate: 0x031fa3fe2db67d482ef3b3b6f6facf874cf1502af8a463d8ac75f378a09d78f012, owner: 0x04033b8c4cfdf815828620bd5ed254225f2be4ecfcd1b7c72d096f385835ca1c8d70, amount: U256 { raw: 10000000000000000000 } })
|- END
|- LDOWN(2)
|- UP(Tokens { rri: 0x01, owner: 0x04033b8c4cfdf815828620bd5ed254225f2be4ecfcd1b7c72d096f385835ca1c8d70, amount: U256 { raw: 9999999999999999995 } })
|- UP(Tokens { rri: 0x01, owner: 0x04039af69ffd4752e60d0f584f4ce39526dd855e1c35293473f683de09f6b19e4c96, amount: U256 { raw: 1 } })
|- END
|- SIG(0x01d52f25d0690171b4d4cfc5e6df2415e395487b13e29fb71fc35617117e46d5bc2f5c0eb98495b350107143852badea414d34da674bccfda1639835b6a98ae35f)`,
					txID:
						'58c89726be35fb33c8dee86eb6c1cfbc3107b07e3818d115201914735f02a85d',
				},
			})
		})

		it('Fee_Transfer_Unstake', () => {
			testComplex({
				blobHex:
					'04e31133f949d9d4a453c189e8b7c3b016215513f50b2ec9809b19f950954cbf040000000109210000000000000000000000000000000000000000000000000000000000000000040103010403a8791ee326620a8b0d5ba636eb0422122c577698cbdb1ea97a0d3d56c33c60be0000000000000000000000000000000000000000000000008ac7230489e7fffc0005000000020103010403a8791ee326620a8b0d5ba636eb0422122c577698cbdb1ea97a0d3d56c33c60be0000000000000000000000000000000000000000000000008ac7230489e7fffb0103010402b8777eab54ba8818cb82376a5798c9c7a025c216fb05266e794cd8c5f0dd4d7a00000000000000000000000000000000000000000000000000000000000000010004361a8ec30813bafdf3b547482353080cc6b7cbd8e893496fa141d9915ae180c300000007010d02ec11f6184839402b78f5a6fbe3e5eddf41cb999ac9c3ae0cdb324ab01f8e3f200403a8791ee326620a8b0d5ba636eb0422122c577698cbdb1ea97a0d3d56c33c60be0000000000000000000000000000000000000000000000008ac7230489e80000000701245999e301296f716d5a5dcf064bd72c9672bf9b84eb9b4fd410ac96b8942480594aa079000cbbf9da55d0ddda9e4fb50c2f5ddca539b1c9cf96a4e12ac45fd4',
				expected: {
					parsedTX: `Instructions:
|- DOWN(SubstateId { hash: 0xe31133f949d9d4a453c189e8b7c3b016215513f50b2ec9809b19f950954cbf04, index: 1 })
|- SYSCALL(0x000000000000000000000000000000000000000000000000000000000000000004)
|- UP(Tokens { rri: 0x01, owner: 0x0403a8791ee326620a8b0d5ba636eb0422122c577698cbdb1ea97a0d3d56c33c60be, amount: U256 { raw: 9999999999999999996 } })
|- END
|- LDOWN(2)
|- UP(Tokens { rri: 0x01, owner: 0x0403a8791ee326620a8b0d5ba636eb0422122c577698cbdb1ea97a0d3d56c33c60be, amount: U256 { raw: 9999999999999999995 } })
|- UP(Tokens { rri: 0x01, owner: 0x0402b8777eab54ba8818cb82376a5798c9c7a025c216fb05266e794cd8c5f0dd4d7a, amount: U256 { raw: 1 } })
|- END
|- DOWN(SubstateId { hash: 0x361a8ec30813bafdf3b547482353080cc6b7cbd8e893496fa141d9915ae180c3, index: 7 })
|- UP(PreparedUnstake { delegate: 0x02ec11f6184839402b78f5a6fbe3e5eddf41cb999ac9c3ae0cdb324ab01f8e3f20, owner: 0x0403a8791ee326620a8b0d5ba636eb0422122c577698cbdb1ea97a0d3d56c33c60be, amount: U256 { raw: 10000000000000000000 } })
|- END
|- SIG(0x01245999e301296f716d5a5dcf064bd72c9672bf9b84eb9b4fd410ac96b8942480594aa079000cbbf9da55d0ddda9e4fb50c2f5ddca539b1c9cf96a4e12ac45fd4)`,
					txID:
						'd8a0aa158f7fd03b261709dc7d64561de653de8b1d9489567c43370728d73f12',
				},
			})
		})

		it('Fee_Transfer_Transfer', () => {
			testComplex({
				blobHex:
					'044b95e6aa95cae5010419b986e8913a5c9628647b0ea21d977dc96c4baa4ef2d200000001092100000000000000000000000000000000000000000000000000000000000000000401030104034ca24c2b7000f439ca21cbb11b044d48f90c987b2aee6608a2570a466612dae20000000000000000000000000000000000000000000000008ac7230489e7fffc00050000000201030104034ca24c2b7000f439ca21cbb11b044d48f90c987b2aee6608a2570a466612dae20000000000000000000000000000000000000000000000008ac7230489e7fffb0103010402bd961fbe8bb26ae1087392f5f7838841faaab23f7f8c67541627828caf49a06d000000000000000000000000000000000000000000000000000000000000000100050000000501030104034ca24c2b7000f439ca21cbb11b044d48f90c987b2aee6608a2570a466612dae20000000000000000000000000000000000000000000000008ac7230489e7fff9010301040345497f80cf2c495286a146178bc2ad1a95232a8fce45856c55d67716cda020b90000000000000000000000000000000000000000000000000000000000000002000700c3fc7baf6a473711f478168ebbed42717844e7dcd55d67bfdfb29c4fcdb0bc0438a3afff25fd161adaf7d43501f18ed9f229aec649873eb2933bf7f38ed1d7f6',
				expected: {
					parsedTX: `Instructions:
|- DOWN(SubstateId { hash: 0x4b95e6aa95cae5010419b986e8913a5c9628647b0ea21d977dc96c4baa4ef2d2, index: 1 })
|- SYSCALL(0x000000000000000000000000000000000000000000000000000000000000000004)
|- UP(Tokens { rri: 0x01, owner: 0x04034ca24c2b7000f439ca21cbb11b044d48f90c987b2aee6608a2570a466612dae2, amount: U256 { raw: 9999999999999999996 } })
|- END
|- LDOWN(2)
|- UP(Tokens { rri: 0x01, owner: 0x04034ca24c2b7000f439ca21cbb11b044d48f90c987b2aee6608a2570a466612dae2, amount: U256 { raw: 9999999999999999995 } })
|- UP(Tokens { rri: 0x01, owner: 0x0402bd961fbe8bb26ae1087392f5f7838841faaab23f7f8c67541627828caf49a06d, amount: U256 { raw: 1 } })
|- END
|- LDOWN(5)
|- UP(Tokens { rri: 0x01, owner: 0x04034ca24c2b7000f439ca21cbb11b044d48f90c987b2aee6608a2570a466612dae2, amount: U256 { raw: 9999999999999999993 } })
|- UP(Tokens { rri: 0x01, owner: 0x040345497f80cf2c495286a146178bc2ad1a95232a8fce45856c55d67716cda020b9, amount: U256 { raw: 2 } })
|- END
|- SIG(0x00c3fc7baf6a473711f478168ebbed42717844e7dcd55d67bfdfb29c4fcdb0bc0438a3afff25fd161adaf7d43501f18ed9f229aec649873eb2933bf7f38ed1d7f6)`,
					txID:
						'4744eaf2842d9d451c4293f1ee3964f638a14bca37fbdb900b4f5381c81af1d4',
				},
			})
		})
	})

	describe('containing stake', () => {
		it('full stake', () => {
			const blobHex =
				'049269ef21d819398237d428001a34d4ac9baabbd63c90e19e09e76864d7885bbb000000030104040387ca83ea04f7f570b978ff29a1673b4ba7e590316255e6036e725808d7bed4a40387ca83ea04f7f570b978ff29a1673b4ba7e590316255e6036e725808d7bed4a40000000000000000000000000000000000000000000000056bc75e2d631000000007000ed97e5664df372ea8a0f24d0cf4e63449c0131b5f0eb707491e9afc6078e72658760cce82a2a42e80628f366bf0e4f21ad3affc9e027a6365efead24d22f3ed'
			const blob = Buffer.from(blobHex, 'hex')
			const txRes = Transaction.fromBuffer(blob)
			if (txRes.isErr()) {
				throw txRes.error
			}
			const parsedTx: TransactionT = txRes.value
			console.log(`✅ parsed tx: ${parsedTx.toString()}`)
			expect(parsedTx.toBuffer().toString('hex')).toBe(blobHex)

			const ins = parsedTx.instructions

			expect(ins.length).toBe(4)
			expect(
				ins.map(i => i.instructionType).map(it => InstructionType[it]),
			).toStrictEqual(['DOWN', 'UP', 'END', 'SIG'])

			const i0_DOWN = ins[0] as Ins_DOWN
			expect(i0_DOWN.substateId.index).toBe(3)

			const i1_UP = ins[1] as Ins_UP
			expect(i1_UP.substate.substateType).toBe(
				SubStateType.PREPARED_STAKE,
			)
			const stakeSubstate = i1_UP.substate as PreparedStakeT
			expect(stakeSubstate.owner.toBuffer().toString('hex')).toBe(
				'040387ca83ea04f7f570b978ff29a1673b4ba7e590316255e6036e725808d7bed4a4',
			)
			expect(stakeSubstate.delegate.toString(true)).toBe(
				'0387ca83ea04f7f570b978ff29a1673b4ba7e590316255e6036e725808d7bed4a4',
			)
			expect(stakeSubstate.amount.toString()).toBe(
				'100000000000000000000',
			)

			const i2_END = ins[2] as Ins_END
			const i3_SIG = ins[3] as Ins_SIG
			expect(i3_SIG.signature.toBuffer().toString('hex')).toBe(
				'000ed97e5664df372ea8a0f24d0cf4e63449c0131b5f0eb707491e9afc6078e72658760cce82a2a42e80628f366bf0e4f21ad3affc9e027a6365efead24d22f3ed',
			)
		})

		it('partial stake', () => {
			const blobHex =
				'046f316f441da9d45ac76ebb603a249612ec0308f047bf7dc1aab10065c0acb6d100000003010301040335ed93414e2a68e6fe717f72f1ff4e6cf3ca44c93493fc5cae25885c0be6d9c30000000000000000000000000000000000000000000000022b1c8c1227a000000104040335ed93414e2a68e6fe717f72f1ff4e6cf3ca44c93493fc5cae25885c0be6d9c30335ed93414e2a68e6fe717f72f1ff4e6cf3ca44c93493fc5cae25885c0be6d9c300000000000000000000000000000000000000000000000340aad21b3b7000000007016d9e2ad24baff9598cc88034d1412086d1fe8dc426ad5768b45fd66ba878453533b0b14f660240d5d9932268f0822e71fbf58fb3405733d622b4e43c68cfc528'
			const blob = Buffer.from(blobHex, 'hex')
			const txRes = Transaction.fromBuffer(blob)
			if (txRes.isErr()) {
				throw txRes.error
			}
			const parsedTx: TransactionT = txRes.value
			console.log(`✅ parsed tx: ${parsedTx.toString()}`)
			expect(parsedTx.toBuffer().toString('hex')).toBe(blobHex)

			const ins = parsedTx.instructions

			expect(ins.length).toBe(5)
			expect(
				ins.map(i => i.instructionType).map(it => InstructionType[it]),
			).toStrictEqual(['DOWN', 'UP', 'UP', 'END', 'SIG'])

			const pubKeyHex =
				'0335ed93414e2a68e6fe717f72f1ff4e6cf3ca44c93493fc5cae25885c0be6d9c3'

			const i0_DOWN = ins[0] as Ins_DOWN
			expect(i0_DOWN.substateId.index).toBe(3)
			const i1_UP = ins[1] as Ins_UP
			expect(i1_UP.substate.substateType).toBe(SubStateType.TOKENS)
			const tokens = i1_UP.substate as TokensT
			expect(tokens.amount.toString()).toBe('40000000000000000000')
			expect(tokens.owner.toString().includes(pubKeyHex)).toBe(true)
			const i2_UP = ins[2] as Ins_UP
			expect(i2_UP.substate.substateType).toBe(
				SubStateType.PREPARED_STAKE,
			)
			const prepareStake = i2_UP.substate as PreparedStakeT
			expect(prepareStake.amount.toString()).toBe('60000000000000000000')

			const i3_END = ins[3] as Ins_END
			const i4_SIG = ins[4] as Ins_SIG
			expect(i4_SIG.signature.toBuffer().toString('hex')).toBe(
				'016d9e2ad24baff9598cc88034d1412086d1fe8dc426ad5768b45fd66ba878453533b0b14f660240d5d9932268f0822e71fbf58fb3405733d622b4e43c68cfc528',
			)
		})
	})

	describe('unstake', () => {
		it('full unstake', () => {
			const blobHex =
				'0471ef8cd6502f8eca028307510ed4460d62de681e8c20952901b756695e867e4a00000007010d0233551e3b75bebc0ea230fd565b09b44585f06d226188364f9fc6d6f9f5515b16040233551e3b75bebc0ea230fd565b09b44585f06d226188364f9fc6d6f9f5515b160000000000000000000000000000000000000000000000056bc75e2d631000000007002b8c22d82649c4d8744674409273c01ad3a2a26f9c43dab6daf3decafd541cc321fc55f5e8bdaeb3bd24806f308ea36aa61bd4fbb8f5a5d2b67462d8d70ecf40'

			const blob = Buffer.from(blobHex, 'hex')
			const txRes = Transaction.fromBuffer(blob)
			if (txRes.isErr()) {
				throw txRes.error
			}
			const parsedTx: TransactionT = txRes.value
			console.log(`✅ parsed tx: ${parsedTx.toString()}`)
			expect(parsedTx.toBuffer().toString('hex')).toBe(blobHex)

			const ins = parsedTx.instructions
			expect(ins.length).toBe(4)
			expect(
				ins.map(i => i.instructionType).map(it => InstructionType[it]),
			).toStrictEqual(['DOWN', 'UP', 'END', 'SIG'])

			const i0_DOWN = ins[0] as Ins_DOWN
			expect(i0_DOWN.substateId.index).toBe(7)

			const pubKeyHex =
				'0233551e3b75bebc0ea230fd565b09b44585f06d226188364f9fc6d6f9f5515b16'

			const i1_UP = ins[1] as Ins_UP
			expect(i1_UP.substate.substateType).toBe(
				SubStateType.PREPARED_UNSTAKE,
			)
			const unstake = i1_UP.substate as PreparedUnstakeT
			expect(unstake.amount.toString()).toBe('100000000000000000000')
			expect(unstake.delegate.toString(true)).toBe(pubKeyHex)
			expect(unstake.owner.toString().includes(pubKeyHex)).toBe(true)

			const i3_SIG = ins[3] as Ins_SIG
			expect(i3_SIG.signature.toBuffer().toString('hex')).toBe(
				'002b8c22d82649c4d8744674409273c01ad3a2a26f9c43dab6daf3decafd541cc321fc55f5e8bdaeb3bd24806f308ea36aa61bd4fbb8f5a5d2b67462d8d70ecf40',
			)
		})

		it('partial unstake', () => {
			const blobHex =
				'047f9f7a47b7e47735d357a2340ecee0cf64ca8172890031952f27148030e30c7800000007010b03b5ef1e8b4c16e1b0a9d27a2391f2c664ea5a09108f9e220b25027a574f9bcd340403b5ef1e8b4c16e1b0a9d27a2391f2c664ea5a09108f9e220b25027a574f9bcd340000000000000000000000000000000000000000000000022b1c8c1227a00000010d03b5ef1e8b4c16e1b0a9d27a2391f2c664ea5a09108f9e220b25027a574f9bcd340403b5ef1e8b4c16e1b0a9d27a2391f2c664ea5a09108f9e220b25027a574f9bcd3400000000000000000000000000000000000000000000000340aad21b3b700000000700e90ed1f8f2b118502da221e7b050d6800776905f68b33066efbc33e9167c2e3749f392b07d9991f8941b684a716d2c698b6c7603ab6eadc720b0958426a0c7a4'

			const blob = Buffer.from(blobHex, 'hex')
			const txRes = Transaction.fromBuffer(blob)
			if (txRes.isErr()) {
				throw txRes.error
			}
			const parsedTx: TransactionT = txRes.value
			console.log(`✅ parsed tx: ${parsedTx.toString()}`)
			expect(parsedTx.toBuffer().toString('hex')).toBe(blobHex)

			const ins = parsedTx.instructions

			expect(ins.length).toBe(5)
			expect(
				ins.map(i => i.instructionType).map(it => InstructionType[it]),
			).toStrictEqual(['DOWN', 'UP', 'UP', 'END', 'SIG'])

			const i0_DOWN = ins[0] as Ins_DOWN
			expect(i0_DOWN.substateId.index).toBe(7)
			const i1_UP = ins[1] as Ins_UP

			const pubKeyHex =
				'03b5ef1e8b4c16e1b0a9d27a2391f2c664ea5a09108f9e220b25027a574f9bcd34'

			expect(i1_UP.substate.substateType).toBe(SubStateType.STAKE_SHARE)
			const stakeShare = i1_UP.substate as StakeShareT
			expect(stakeShare.amount.toString()).toBe('40000000000000000000')
			expect(stakeShare.delegate.toString(true)).toBe(pubKeyHex)
			expect(stakeShare.owner.toBuffer().toString('hex')).toBe(
				`04${pubKeyHex}`,
			)
			const i2_UP = ins[2] as Ins_UP

			expect(i2_UP.substate.substateType).toBe(
				SubStateType.PREPARED_UNSTAKE,
			)
			const unstake = i2_UP.substate as PreparedUnstakeT
			expect(unstake.amount.toString()).toBe('60000000000000000000')
			expect(unstake.delegate.toString(true)).toBe(pubKeyHex)
			expect(unstake.owner.toBuffer().toString('hex')).toBe(
				`04${pubKeyHex}`,
			)

			const i3_END = ins[3] as Ins_END
			const i4_SIG = ins[4] as Ins_SIG
			expect(i4_SIG.signature.toBuffer().toString('hex')).toBe(
				'00e90ed1f8f2b118502da221e7b050d6800776905f68b33066efbc33e9167c2e3749f392b07d9991f8941b684a716d2c698b6c7603ab6eadc720b0958426a0c7a4',
			)
		})
	})

	describe('containing tokentransfer', () => {
		it('with remainder without fee', () => {
			const blobHex =
				'04ace518e61b07f95c1fe16e120cc0691f9514f1fee21b0dac44e637453f538bbf00000003010303c81161158edfd37cfee329ff957c1e31c9f45841549a3e3f88290403cc5a7e43d9e1174171a55b6c0ba8c1ad1693abd0c734d8782e8525e09b6c757a0000000000000000000000000000000000000000000000000000000000000004010303c81161158edfd37cfee329ff957c1e31c9f45841549a3e3f882904021889ddebe74830d9a4714ef07f57d146ef925b9b436f223486bfcc6e9ea00a090000000000000000000000000000000000000000000000000000000000000006000701773f2aed8a8fe5a4614936dbc0c37dfc95fd97c899122ba3afd17cb2a9dd1f3b1cb7c9649741081470757011cecbe48c546398c61cab7c4b74640744865b7bda'
			const blob = Buffer.from(blobHex, 'hex')
			const txRes = Transaction.fromBuffer(blob)
			if (txRes.isErr()) {
				throw txRes.error
			}
			const parsedTx: TransactionT = txRes.value
			console.log(`✅ parsed tx: ${parsedTx.toString()}`)
			expect(parsedTx.toBuffer().toString('hex')).toBe(blobHex)

			const ins = parsedTx.instructions
			expect(ins.length).toBe(5)
			expect(
				ins.map(i => i.instructionType).map(it => InstructionType[it]),
			).toStrictEqual(['DOWN', 'UP', 'UP', 'END', 'SIG'])

			const i0DOWN = ins[0] as Ins_DOWN
			const substateId = i0DOWN.substateId
			expect(substateId.hash.toString('hex')).toBe(
				'ace518e61b07f95c1fe16e120cc0691f9514f1fee21b0dac44e637453f538bbf',
			)
			expect(substateId.index).toBe(3)

			const i1UP = ins[1] as Ins_UP
			expect(i1UP.instructionType).toBe(InstructionType.UP)
			expect(i1UP.substate.substateType).toBe(SubStateType.TOKENS)
			const transfer0 = i1UP.substate as TokensT

			const expectedRRI =
				'03c81161158edfd37cfee329ff957c1e31c9f45841549a3e3f8829'

			expect(transfer0.amount.valueOf()).toBe(4)
			expect(transfer0.rri.toBuffer().toString('hex')).toBe(expectedRRI)
			expect(transfer0.owner.toBuffer().toString('hex')).toBe(
				'0403cc5a7e43d9e1174171a55b6c0ba8c1ad1693abd0c734d8782e8525e09b6c757a',
			)

			const i2UP = ins[2] as Ins_UP
			expect(i2UP.instructionType).toBe(InstructionType.UP)
			expect(i2UP.substate.substateType).toBe(SubStateType.TOKENS)
			const transfer1 = i2UP.substate as TokensT
			expect(transfer1.amount.valueOf()).toBe(6)
			expect(transfer1.rri.toBuffer().toString('hex')).toBe(expectedRRI)
			expect(transfer1.owner.toBuffer().toString('hex')).toBe(
				'04021889ddebe74830d9a4714ef07f57d146ef925b9b436f223486bfcc6e9ea00a09',
			)

			const i3END = ins[3] as Ins_END
			expect(i3END.instructionType).toBe(InstructionType.END)
			expect(i3END.toBuffer().toString('hex')).toBe('00')

			const i4SIG = ins[4] as Ins_SIG
			expect(i4SIG.instructionType).toBe(InstructionType.SIG)
			expect(i4SIG.signature.toBuffer().toString('hex')).toBe(
				'01773f2aed8a8fe5a4614936dbc0c37dfc95fd97c899122ba3afd17cb2a9dd1f3b1cb7c9649741081470757011cecbe48c546398c61cab7c4b74640744865b7bda',
			)
		})
	})
})
