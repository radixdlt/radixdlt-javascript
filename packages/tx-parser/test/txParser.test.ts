import { Transaction } from '../src/transaction'
import {
	Ins_HEADER,
	Ins_SYSCALL,
	InstructionType,
	REAddressPublicKey,
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
import { PublicKey, PublicKeyT, sha256Twice } from '@radixdlt/crypto'
import { UInt256 } from '@radixdlt/uint256'

const chunkArray = <T>(myArray: T[], chunk_size: number): T[][] => {
	const results: T[][] = [] as T[][]
	while (myArray.length) {
		results.push(myArray.splice(0, chunk_size))
	}
	return results
}

const feeOfTransaction = (tx: TransactionT): UInt256 => {
	const sysCallIns = tx.instructions.find(
		i => i.instructionType === InstructionType.SYSCALL,
	)
	if (!sysCallIns) {
		return UInt256.valueOf(0)
	}
	const sysCall = sysCallIns as Ins_SYSCALL
	const txFeeData = sysCall.callData.data
	return new UInt256(txFeeData.toString('hex'), 16)
}

const costOfTransactionExcludingTxFee = (
	tx: TransactionT,
	myPublicKey: PublicKeyT,
): UInt256 => {
	return tx.instructions
		.filter(i => i.instructionType === InstructionType.UP)
		.map(i => i as Ins_UP)
		.filter(i => i.substate.substateType === SubStateType.TOKENS)
		.map(i => i.substate as TokensT)
		.filter(
			t => !(t.owner as REAddressPublicKey).publicKey.equals(myPublicKey),
		)
		.map(t => t.amount)
		.reduce((prev, cur) => {
			return prev.add(cur)
		}, UInt256.valueOf(0))
}

const costOfTransactionIncludingTxFee = (
	tx: TransactionT,
	myPublicKey: PublicKeyT,
): UInt256 => {
	const txFee = feeOfTransaction(tx)
	const costOfTransfers = costOfTransactionExcludingTxFee(tx, myPublicKey)
	return txFee.add(costOfTransfers)
}

describe('txParser', () => {
	describe('complex tx with multiple substate groups', () => {
		it.skip('Transfer_Transfer_Stake_VERY_detailed_parse_assertion', () => {
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

		const testComplex = (input: {
			description: string
			myPublicKeyHex: string // used to calculate cost of tx by filtering out transfer back to me
			blobHex: string
			expected: {
				txFee: string
				totalXRDCost: string
				hash: string
				parsedTX: string
			}
		}): void => {
			const { description, blobHex, expected } = input
			const blob = Buffer.from(blobHex, 'hex')

			const hash = sha256Twice(blob)
			expect(hash.toString('hex')).toBe(expected.hash)

			console.log(description)
			console.log(blobHex)
			const txRes = Transaction.fromBuffer(blob)
			if (txRes.isErr()) {
				throw txRes.error
			}
			const parsedTx: TransactionT = txRes.value
			console.log(parsedTx.toString())

			let humanReadableString = ''
			for (const instruction of parsedTx.instructions) {
				const humanReadableStr =
					instruction.toHumanReadableString !== undefined
						? instruction.toHumanReadableString()
						: instruction.toString()
				humanReadableString += humanReadableStr
				humanReadableString += '\n\n'
			}

			console.log(humanReadableString)

			expect(parsedTx.toString()).toBe(expected.parsedTX)

			// if (expected.txID) {
			// 	expect(parsedTx.txID()).toBe(expected.txID)
			// }
			//
			// if (expected.hashOnce) {
			// 	const hash = sha256(blob)
			// 	expect(hash.toString('hex')).toBe(expected.hashOnce)
			// }

			const myPublicKey = PublicKey.fromBuffer(
				Buffer.from(input.myPublicKeyHex, 'hex'),
			)._unsafeUnwrap()

			const txFee = feeOfTransaction(parsedTx)
			expect(txFee.toString(10)).toBe(expected.txFee)

			const cost = costOfTransactionIncludingTxFee(parsedTx, myPublicKey)
			expect(cost.toString(10)).toBe(expected.totalXRDCost)

			// console.log(testVectorInsStr)

			const hashByteString = chunkArray([...hash] as number[], 8)
				.map((array: number[]) =>
					array
						.map(
							(byte: number) =>
								`0x${byte <= 0x0f ? '0' : ''}${byte.toString(
									16,
								)}`,
						)
						.join(', '),
				)
				.join(',\n')

			let expectedInstructionsString = `expected_instruction_t expected_instructions[] = {\n`
			for (const ins of parsedTx.instructions) {
				expectedInstructionsString += '\t{\n'
				expectedInstructionsString += `\t\t.ins_len = ${
					ins.toBuffer().length
				},\n`
				expectedInstructionsString += `\t\t.ins_hex = "${ins
					.toBuffer()
					.toString('hex')}",\n`
				expectedInstructionsString += `\t\t.instruction_type = INS_${
					InstructionType[ins.instructionType]
				},\n`
				expectedInstructionsString += `\t\t.substate_type = ${
					ins.instructionType === InstructionType.UP
						? 'SUBSTATE_TYPE_' +
						  SubStateType[ins.substate.substateType]
						: 'IRRELEVANT'
				},\n`
				expectedInstructionsString += '\t},\n'
			}
			expectedInstructionsString += '};\n'
			// console.log(expectedInstructionsString)

			const testVectorString = `
static void test_${description}(void **state) {
    (void) state;
			
	${expectedInstructionsString}
			
  test_vector_t test_vector = (test_vector_t){
        .total_number_of_instructions = ${parsedTx.instructions.length},
        .expected_instructions = expected_instructions,
        .expected_tx_fee = "${txFee.toString(10)}",
        .expected_total_xrd_amount = "${cost.toString(10)}",
        .expected_hash =
            {
                // clang-format off
${hashByteString}
                // clang-format on
            },  //         expected hash:
                //         ${hash.toString('hex')}
		.my_public_key_hex = "${input.myPublicKeyHex}",
    };
    
    
    do_test_parse_tx(test_vector);
}
			`

			console.log(testVectorString)
		}

		it('Transfer_Transfer_Stake', () => {
			testComplex({
				description: 'Transfer_Transfer_Stake',
				myPublicKeyHex:
					'02486d8128388446ac8c239d0a615a5bcfd1ebbecce5c8704f68876187a18679d8',
				blobHex:
					'0a000104374c00efbe61f645a8b35d7746e106afa7422877e5d607975b6018e0a1aa6bf0000000040921000000000000000000000000000000000000000000000000000000000000000002010301040377bac8066e51cd0d6b320c338d5abbcdbcca25572b6b3eee9443eafc92106bba000000000000000000000000000000000000000000000001158e460913cffffe000500000003010301040377bac8066e51cd0d6b320c338d5abbcdbcca25572b6b3eee9443eafc92106bba0000000000000000000000000000000000000000000000008ac7230489e7fffe0104040377bac8066e51cd0d6b320c338d5abbcdbcca25572b6b3eee9443eafc92106bba02f19b2d095a553f3a41da4a8dc1f8453dfbdc733c5aece8b128b7d7999ae247a50000000000000000000000000000000000000000000000008ac7230489e8000000',
				expected: {
					txFee: '2',
					totalXRDCost: '29999999999999999998',
					hash:
						'83f4544ff1fbabc7be39c6f531c3f37fc50e0a0b653afdb22cc9f8e8aa461fc9',
					parsedTX: `Instructions:
|- HEADER(0, 1)
|- DOWN(SubstateId { hash: 0x374c00efbe61f645a8b35d7746e106afa7422877e5d607975b6018e0a1aa6bf0, index: 4 })
|- SYSCALL(0x000000000000000000000000000000000000000000000000000000000000000002)
|- UP(Tokens { rri: 0x01, owner: 0x040377bac8066e51cd0d6b320c338d5abbcdbcca25572b6b3eee9443eafc92106bba, amount: U256 { raw: 19999999999999999998 } })
|- END
|- LDOWN(3)
|- UP(Tokens { rri: 0x01, owner: 0x040377bac8066e51cd0d6b320c338d5abbcdbcca25572b6b3eee9443eafc92106bba, amount: U256 { raw: 9999999999999999998 } })
|- UP(PreparedStake { owner: 0x040377bac8066e51cd0d6b320c338d5abbcdbcca25572b6b3eee9443eafc92106bba, delegate: 0x02f19b2d095a553f3a41da4a8dc1f8453dfbdc733c5aece8b128b7d7999ae247a5, amount: U256 { raw: 10000000000000000000 } })
|- END`,
				},
			})
		})

		it('Fee_Stake_Transfer', () => {
			testComplex({
				description: 'Fee_Stake_Transfer',
				myPublicKeyHex:
					'036b062b0044f412f30a973947e5e986629669d055b78fcfbb68a63211462ed0f7',
				blobHex:
					'0a0001045d375643dded796e8d3526dcae7a068c642e35fb9931688f56ea20b56289330f0000000309210000000000000000000000000000000000000000000000000000000000deadbeef0103010402ed0eeaf54a79df88f12f251f22b88df00afaad43497f448620353a94e5c2e155000000000000000000000000000000000000000000000001158e460913cffffe0005000000020103010402ed0eeaf54a79df88f12f251f22b88df00afaad43497f448620353a94e5c2e1550000000000000000000000000000000000000000000000008ac7230489e7fffe01040402ed0eeaf54a79df88f12f251f22b88df00afaad43497f448620353a94e5c2e15502fd72e14bae5305db65f51d723e0a68a54a49dc85d0875b44d3cf1e80413de8870000000000000000000000000000000000000000000000008ac7230489e800000005000000050103010402ed0eeaf54a79df88f12f251f22b88df00afaad43497f448620353a94e5c2e1550000000000000000000000000000000000000000000000008ac7230489e7fffd01030104036b062b0044f412f30a973947e5e986629669d055b78fcfbb68a63211462ed0f7000000000000000000000000000000000000000000000000000000000000000100',
				expected: {
					txFee: '3735928559',
					totalXRDCost: '40000000003735928552',
					hash:
						'42325f68c16071d0f244be9a7382b34e52037c4c6ba63543fc6856220f42270d',
					parsedTX: `Instructions:
|- HEADER(0, 1)
|- DOWN(SubstateId { hash: 0x5d375643dded796e8d3526dcae7a068c642e35fb9931688f56ea20b56289330f, index: 3 })
|- SYSCALL(0x0000000000000000000000000000000000000000000000000000000000deadbeef)
|- UP(Tokens { rri: 0x01, owner: 0x0402ed0eeaf54a79df88f12f251f22b88df00afaad43497f448620353a94e5c2e155, amount: U256 { raw: 19999999999999999998 } })
|- END
|- LDOWN(2)
|- UP(Tokens { rri: 0x01, owner: 0x0402ed0eeaf54a79df88f12f251f22b88df00afaad43497f448620353a94e5c2e155, amount: U256 { raw: 9999999999999999998 } })
|- UP(PreparedStake { owner: 0x0402ed0eeaf54a79df88f12f251f22b88df00afaad43497f448620353a94e5c2e155, delegate: 0x02fd72e14bae5305db65f51d723e0a68a54a49dc85d0875b44d3cf1e80413de887, amount: U256 { raw: 10000000000000000000 } })
|- END
|- LDOWN(5)
|- UP(Tokens { rri: 0x01, owner: 0x0402ed0eeaf54a79df88f12f251f22b88df00afaad43497f448620353a94e5c2e155, amount: U256 { raw: 9999999999999999997 } })
|- UP(Tokens { rri: 0x01, owner: 0x04036b062b0044f412f30a973947e5e986629669d055b78fcfbb68a63211462ed0f7, amount: U256 { raw: 1 } })
|- END`,
				},
			})
		})

		it('Transfer_PartialTransfer_Transfer_Stake', () => {
			testComplex({
				description: 'Transfer_PartialTransfer_Transfer_Stake',
				myPublicKeyHex:
					'022c4f0832c24ebc6477005c397fa51e8de0710098b816d43a85332658c7a21411',
				blobHex:
					'0a000104c1e268b8b61ce5688d039aefa1e5ea6612a6c4d3b497713582916b533d6c5028000000030921000000000000000000000000000000000000000000000038821089088b6063da1801030104035c8522494136cab2c7445cd485a905338fa9191d0d3314cf0e3b60a792119f2b000000000000000000000000000000000000000000000001158e460913cffffe00050000000201030104035c8522494136cab2c7445cd485a905338fa9191d0d3314cf0e3b60a792119f2b000000000000000000000000000000000000000000000001158e460913cffffd01030104022c4f0832c24ebc6477005c397fa51e8de0710098b816d43a85332658c7a21411000000000000000000000000000000000000000000000000000000000000000100050000000501030104035c8522494136cab2c7445cd485a905338fa9191d0d3314cf0e3b60a792119f2b0000000000000000000000000000000000000000000000008ac7230489e7fffd010404035c8522494136cab2c7445cd485a905338fa9191d0d3314cf0e3b60a792119f2b037bf52ffd736eda6554b3b7b03eae3f9e2bd9b4b1c11e73355191403ff96961ac0000000000000000000000000000000000000000000000008ac7230489e8000000',
				expected: {
					txFee: '266851791263253500516888',
					totalXRDCost: '266901791263253500516880',
					hash: 'dabbe3c3601b3bbc5863368e8e8f061c24420a9b2e0658ad50a740eeb61602de',
					parsedTX: `Instructions:
|- HEADER(0, 1)
|- DOWN(SubstateId { hash: 0xc1e268b8b61ce5688d039aefa1e5ea6612a6c4d3b497713582916b533d6c5028, index: 3 })
|- SYSCALL(0x000000000000000000000000000000000000000000000038821089088b6063da18)
|- UP(Tokens { rri: 0x01, owner: 0x04035c8522494136cab2c7445cd485a905338fa9191d0d3314cf0e3b60a792119f2b, amount: U256 { raw: 19999999999999999998 } })
|- END
|- LDOWN(2)
|- UP(Tokens { rri: 0x01, owner: 0x04035c8522494136cab2c7445cd485a905338fa9191d0d3314cf0e3b60a792119f2b, amount: U256 { raw: 19999999999999999997 } })
|- UP(Tokens { rri: 0x01, owner: 0x04022c4f0832c24ebc6477005c397fa51e8de0710098b816d43a85332658c7a21411, amount: U256 { raw: 1 } })
|- END
|- LDOWN(5)
|- UP(Tokens { rri: 0x01, owner: 0x04035c8522494136cab2c7445cd485a905338fa9191d0d3314cf0e3b60a792119f2b, amount: U256 { raw: 9999999999999999997 } })
|- UP(PreparedStake { owner: 0x04035c8522494136cab2c7445cd485a905338fa9191d0d3314cf0e3b60a792119f2b, delegate: 0x037bf52ffd736eda6554b3b7b03eae3f9e2bd9b4b1c11e73355191403ff96961ac, amount: U256 { raw: 10000000000000000000 } })
|- END`,
				},
			})
		})

		it('Transfer_Unstake_PartialTransfer', () => {
			testComplex({
				description: 'Transfer_Unstake_PartialTransfer',
				myPublicKeyHex:
					'039af69ffd4752e60d0f584f4ce39526dd855e1c35293473f683de09f6b19e4c96',
				blobHex:
					'0a00010414f4235a478a63f7c17795bb482ed22efb8bcbe5239d3a5544f33b26f308747500000001092100000000000000000000000000000000000000000000000000000000000000303901030104033b8c4cfdf815828620bd5ed254225f2be4ecfcd1b7c72d096f385835ca1c8d700000000000000000000000000000000000000000000000008ac7230489e7fffc00045e01ca4385fe4ba31d3649ae7cc746446d46c4405064bf7c6d4faa853586eab700000007010d031fa3fe2db67d482ef3b3b6f6facf874cf1502af8a463d8ac75f378a09d78f01204033b8c4cfdf815828620bd5ed254225f2be4ecfcd1b7c72d096f385835ca1c8d700000000000000000000000000000000000000000000000008ac7230489e8000000050000000201030104033b8c4cfdf815828620bd5ed254225f2be4ecfcd1b7c72d096f385835ca1c8d700000000000000000000000000000000000000000000000008ac7230489e7fffb01030104039af69ffd4752e60d0f584f4ce39526dd855e1c35293473f683de09f6b19e4c96000000000000000000000000000000000000000000000000000000000000000100',
				expected: {
					txFee: '12345',
					totalXRDCost: '20000000000000012336',
					hash: 'de9e42d39c8a23bd39a7dec80aa313ed3e0c7095873fc9f7104e481b432068c4',
					parsedTX: `Instructions:
|- HEADER(0, 1)
|- DOWN(SubstateId { hash: 0x14f4235a478a63f7c17795bb482ed22efb8bcbe5239d3a5544f33b26f3087475, index: 1 })
|- SYSCALL(0x000000000000000000000000000000000000000000000000000000000000003039)
|- UP(Tokens { rri: 0x01, owner: 0x04033b8c4cfdf815828620bd5ed254225f2be4ecfcd1b7c72d096f385835ca1c8d70, amount: U256 { raw: 9999999999999999996 } })
|- END
|- DOWN(SubstateId { hash: 0x5e01ca4385fe4ba31d3649ae7cc746446d46c4405064bf7c6d4faa853586eab7, index: 7 })
|- UP(PreparedUnstake { delegate: 0x031fa3fe2db67d482ef3b3b6f6facf874cf1502af8a463d8ac75f378a09d78f012, owner: 0x04033b8c4cfdf815828620bd5ed254225f2be4ecfcd1b7c72d096f385835ca1c8d70, amount: U256 { raw: 10000000000000000000 } })
|- END
|- LDOWN(2)
|- UP(Tokens { rri: 0x01, owner: 0x04033b8c4cfdf815828620bd5ed254225f2be4ecfcd1b7c72d096f385835ca1c8d70, amount: U256 { raw: 9999999999999999995 } })
|- UP(Tokens { rri: 0x01, owner: 0x04039af69ffd4752e60d0f584f4ce39526dd855e1c35293473f683de09f6b19e4c96, amount: U256 { raw: 1 } })
|- END`,
				},
			})
		})

		it('Transfer_PartialTransfer_Unstake', () => {
			testComplex({
				description: 'Transfer_PartialTransfer_Unstake',
				myPublicKeyHex:
					'02b8777eab54ba8818cb82376a5798c9c7a025c216fb05266e794cd8c5f0dd4d7a',
				blobHex:
					'0a000104e31133f949d9d4a453c189e8b7c3b016215513f50b2ec9809b19f950954cbf0400000001092100000000000000000000000000000000000000000000000000000000003ade68b10103010403a8791ee326620a8b0d5ba636eb0422122c577698cbdb1ea97a0d3d56c33c60be0000000000000000000000000000000000000000000000008ac7230489e7fffc0005000000020103010403a8791ee326620a8b0d5ba636eb0422122c577698cbdb1ea97a0d3d56c33c60be0000000000000000000000000000000000000000000000008ac7230489e7fffb0103010402b8777eab54ba8818cb82376a5798c9c7a025c216fb05266e794cd8c5f0dd4d7a00000000000000000000000000000000000000000000000000000000000000010004361a8ec30813bafdf3b547482353080cc6b7cbd8e893496fa141d9915ae180c300000007010d02ec11f6184839402b78f5a6fbe3e5eddf41cb999ac9c3ae0cdb324ab01f8e3f200403a8791ee326620a8b0d5ba636eb0422122c577698cbdb1ea97a0d3d56c33c60be0000000000000000000000000000000000000000000000008ac7230489e8000000',
				expected: {
					txFee: '987654321',
					totalXRDCost: '20000000000987654312',
					hash: '1859c7a11b46aefb28860f37afff4fcf5aac2c4c995a65429a4f00f33e4298a3',
					parsedTX: `Instructions:
|- HEADER(0, 1)
|- DOWN(SubstateId { hash: 0xe31133f949d9d4a453c189e8b7c3b016215513f50b2ec9809b19f950954cbf04, index: 1 })
|- SYSCALL(0x00000000000000000000000000000000000000000000000000000000003ade68b1)
|- UP(Tokens { rri: 0x01, owner: 0x0403a8791ee326620a8b0d5ba636eb0422122c577698cbdb1ea97a0d3d56c33c60be, amount: U256 { raw: 9999999999999999996 } })
|- END
|- LDOWN(2)
|- UP(Tokens { rri: 0x01, owner: 0x0403a8791ee326620a8b0d5ba636eb0422122c577698cbdb1ea97a0d3d56c33c60be, amount: U256 { raw: 9999999999999999995 } })
|- UP(Tokens { rri: 0x01, owner: 0x0402b8777eab54ba8818cb82376a5798c9c7a025c216fb05266e794cd8c5f0dd4d7a, amount: U256 { raw: 1 } })
|- END
|- DOWN(SubstateId { hash: 0x361a8ec30813bafdf3b547482353080cc6b7cbd8e893496fa141d9915ae180c3, index: 7 })
|- UP(PreparedUnstake { delegate: 0x02ec11f6184839402b78f5a6fbe3e5eddf41cb999ac9c3ae0cdb324ab01f8e3f20, owner: 0x0403a8791ee326620a8b0d5ba636eb0422122c577698cbdb1ea97a0d3d56c33c60be, amount: U256 { raw: 10000000000000000000 } })
|- END`,
				},
			})
		})

		it('Transfer_PartialTransfer_PartialTransfer', () => {
			testComplex({
				description: 'Transfer_PartialTransfer_PartialTransfer',
				myPublicKeyHex:
					'0345497f80cf2c495286a146178bc2ad1a95232a8fce45856c55d67716cda020b9',
				blobHex:
					'0a0001044b95e6aa95cae5010419b986e8913a5c9628647b0ea21d977dc96c4baa4ef2d200000001092100000000000000000000000000000000000000000000000000000000000000fade01030104034ca24c2b7000f439ca21cbb11b044d48f90c987b2aee6608a2570a466612dae20000000000000000000000000000000000000000000000008ac7230489e7fffc00050000000201030104034ca24c2b7000f439ca21cbb11b044d48f90c987b2aee6608a2570a466612dae20000000000000000000000000000000000000000000000008ac7230489e7fffb010301040345497f80cf2c495286a146178bc2ad1a95232a8fce45856c55d67716cda020b9000000000000000000000000000000000000000000000000000000000000000100050000000501030104034ca24c2b7000f439ca21cbb11b044d48f90c987b2aee6608a2570a466612dae20000000000000000000000000000000000000000000000008ac7230489e7fff9010301040345497f80cf2c495286a146178bc2ad1a95232a8fce45856c55d67716cda020b9000000000000000000000000000000000000000000000000000000000000000200',
				expected: {
					txFee: '64222',
					totalXRDCost: '30000000000000064206',
					hash: '52e8974210ec91ae349b7d9c016fcdfc2408b3994dbca89d0a81dc0e1975a13b',
					parsedTX: `Instructions:
|- HEADER(0, 1)
|- DOWN(SubstateId { hash: 0x4b95e6aa95cae5010419b986e8913a5c9628647b0ea21d977dc96c4baa4ef2d2, index: 1 })
|- SYSCALL(0x00000000000000000000000000000000000000000000000000000000000000fade)
|- UP(Tokens { rri: 0x01, owner: 0x04034ca24c2b7000f439ca21cbb11b044d48f90c987b2aee6608a2570a466612dae2, amount: U256 { raw: 9999999999999999996 } })
|- END
|- LDOWN(2)
|- UP(Tokens { rri: 0x01, owner: 0x04034ca24c2b7000f439ca21cbb11b044d48f90c987b2aee6608a2570a466612dae2, amount: U256 { raw: 9999999999999999995 } })
|- UP(Tokens { rri: 0x01, owner: 0x040345497f80cf2c495286a146178bc2ad1a95232a8fce45856c55d67716cda020b9, amount: U256 { raw: 1 } })
|- END
|- LDOWN(5)
|- UP(Tokens { rri: 0x01, owner: 0x04034ca24c2b7000f439ca21cbb11b044d48f90c987b2aee6608a2570a466612dae2, amount: U256 { raw: 9999999999999999993 } })
|- UP(Tokens { rri: 0x01, owner: 0x040345497f80cf2c495286a146178bc2ad1a95232a8fce45856c55d67716cda020b9, amount: U256 { raw: 2 } })
|- END`,
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
