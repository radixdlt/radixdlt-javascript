import {
	BaseInstructionWithSubState,
	InstructionType,
	SYSCALL_TX_FEE_RESERVE_PUT,
	SYSCALL_TX_FEE_RESERVE_TAKE,
	Transaction,
	TransactionT,
	Ins_SYSCALL,
	Ins_UP,
	InstructionT,
	REAddressType,
	SubStateType,
	TokensT,
	REAddressPublicKey
} from '../src'

import { sha256Twice } from '@radixdlt/crypto'
import { UInt256 } from '@radixdlt/uint256'
import { err, ok, Result } from 'neverthrow'
import { msgFromError } from '@radixdlt/util'

let c_unit_tests_string = ''

export type TestVector = Readonly<{
	blobHex: string
	expected: {
		parsedTX: string
		// Used for total XRD amount calculation
		myPublicKeyHex: string
		txFee: string
		totalXRDAmount: string
		hash: string
	}
}>



const generate_ledger_app_unit_test_c_code_from_test_vector = (
	input: Readonly<{
		testVector: TestVector
		testName: string
		testDescription?: string
	}>,
): string => {
	const { testVector, testName, testDescription } = input
	const expectedHashHex = testVector.expected.hash
	const expectedTxFee = testVector.expected.txFee
	const expectedTotalXRDAmount = testVector.expected.totalXRDAmount
	const myPublicKeyHex = testVector.expected.myPublicKeyHex

	const chunkSubstr = (str: string, size: number): string[] => {
		const numChunks = Math.ceil(str.length / size)
		const chunks = new Array(numChunks)

		for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
			chunks[i] = str.substr(o, size)
		}

		return chunks
	}

	const tx = Transaction.fromBuffer(
		Buffer.from(testVector.blobHex, 'hex'),
	)._unsafeUnwrap()

	const descriptionOfTest =
		testDescription ??
		`Test of successful parsing of TX with #${
			tx.toBuffer().length
		} bytes and #${tx.instructions.length} instructions.`

	const c_code_test_doc = `
/**
 * @brief ${descriptionOfTest}.
 *
 * Test parsing transaction with blob:
 * ${chunkSubstr(testVector.blobHex, 80).join('\n\t')}
 *
 * Deserializes into these instructions:
 * ${chunkSubstr(tx.toString(), 80).join('\n\t')}
 *
 * Expected hash of transaction:
 * ${testVector.expected.hash}
 *
 */`
	const c_code_test_header = `static void test_success_${testName}(void **state) {`

	const sstOrIrrelevant = (instruction: InstructionT): string => {
		const it = instruction.instructionType
		if (!(it === InstructionType.UP || it === InstructionType.VREAD)) {
			return 'IRRELEVANT'
		}
		const substate = (instruction as BaseInstructionWithSubState<InstructionType>)
			.substate
		return `SUBSTATE_TYPE_${SubStateType[substate.substateType]}`
	}

	const c_code_body_expected_instructions_obj_strings = tx.instructions
		.map(
			(ins): string =>
				`{
\t\t.ins_len = ${ins.toBuffer().length},
\t\t// clang-format off
\t\t.ins_hex = "${ins.toBuffer().toString('hex')}",
\t\t// clang-format on
\t\t.instruction_type = INS_${InstructionType[ins.instructionType].toUpperCase()},
\t\t.substate_type = ${sstOrIrrelevant(ins)},
}`,
		)
		.join(',\n')

	const c_code_body_expected_instructions = [
		'expected_instruction_t expected_instructions[] = {',
		c_code_body_expected_instructions_obj_strings,
		'}',
	].join('\n')

	const chunkArray = <T>(myArray: T[], chunk_size: number): T[][] => {
		const results: T[][] = [] as T[][]
		while (myArray.length) {
			results.push(myArray.splice(0, chunk_size))
		}
		return results
	}

	const expectedHashAsUInt8ArrayString: string = chunkArray(
		// @ts-ignore
		[...Buffer.from(expectedHashHex, 'hex')],
		8,
	)
		.map(array =>
			array.map((byte: number) => `0x${byte.toString(16)}`).join(', '),
		)
		.join(',\n\t\t\t')

	const c_code_test_vector = `
    test_vector_t test_vector = (test_vector_t){
        .total_number_of_instructions = ${tx.instructions.length},
        .expected_instructions = expected_instructions,
        .expected_result = EXPECTED_RESULT_SUCCESS,
        .expected_success = {
            .my_public_key_hex =
                "${myPublicKeyHex}",
            .expected_tx_fee = "${expectedTxFee}",
            .expected_total_xrd_amount = "${expectedTotalXRDAmount}",
            .expected_hash = { // clang-format off
\t\t\t${expectedHashAsUInt8ArrayString}
            }, // clang-format on
        }
    }
	`

	const c_code_body = [
		'\t(void) state',
		c_code_body_expected_instructions,
		c_code_test_vector,
		'\tdo_test_parse_tx(test_vector);',
	].join(';\n\n')

	const c_code = [c_code_test_doc, c_code_test_header, c_code_body, '}'].join(
		'\n',
	)

	return c_code
}

/*
		Tx fee is calculated like so
		=====================================================

		Also a new syscall was added `FEE_RESERVE_TAKE (0x01)`, apart from old `FEE_RESERVE_PUT (0x00)` to be able
		to claim back unused fees in the fee reserve. A general user transaction will look like:

			```
			DOWN <substate_id>
			SYSCALL FEE_RESERVE_PUT <put_amt>
			...
			SYSCALL FEE_RESERVE_TAKE <take_amt0>
			...
			SYSCALL FEE_RESERVE_TAKE <take_amt1>
			END
			SIG <signature>
			```

		The corresponding fee paid in the transaction is then:

			```
			fee_paid = put_amt - sum(take_amt*)
			```

		There should only be one and only one put_amt value. There may be 0 or more take_amt values.

	*/
const calculateFeeOfTransaction = (
	transaction: TransactionT,
): Result<UInt256, Error> => {
	const txFeeSysCallInsWithPrefix = (
		prefix:
			| typeof SYSCALL_TX_FEE_RESERVE_PUT
			| typeof SYSCALL_TX_FEE_RESERVE_TAKE,
	): Ins_SYSCALL[] =>
		transaction.instructions
			.filter(ins => ins.instructionType === InstructionType.SYSCALL)
			.map(ins => ins as Ins_SYSCALL)
			.filter(ins => ins.callData.data[0] === prefix)

	const txFeePutInstructions = txFeeSysCallInsWithPrefix(
		SYSCALL_TX_FEE_RESERVE_PUT,
	)

	if (txFeePutInstructions.length !== 1) {
		const errMsg = `ERROR transaction fee did not contain one, and exacly one, SYSCALL with 'TX_FEE_RESERVE_PUT' (0x01 + UInt256), but that is required.`
		return err(new Error(errMsg))
	}

	const amountFromIns = (instruction: Ins_SYSCALL): UInt256 =>
		new UInt256(
			instruction.callData.data
				.slice(1) // we skip first byte, specifying that this is either TX_FEE_RESERVE_PUT or SYSCALL_TX_FEE_RESERVE_TAKE
				.toString('hex'),
			16,
		)

	// Earler asserted that we have one, and exactly one element.
	const txFeePut = amountFromIns(txFeePutInstructions[0])

	const txFeeTakenSum = txFeeSysCallInsWithPrefix(SYSCALL_TX_FEE_RESERVE_TAKE)
		.map(amountFromIns)
		.reduce((prev, cur) => prev.add(cur), UInt256.valueOf(0))

	if (txFeeTakenSum.gt(txFeePut)) {
		const errMsg = `ERROR: Sum of 'txFeeTakenSum' exceeds 'txFeePut', which is not allowed.`
		return err(new Error(errMsg))
	}

	return ok(txFeePut.sub(txFeeTakenSum))
}

const amountOfXRDTransferredOutInTX = (
	transaction: TransactionT,
	myPublicKeyHex: string,
): UInt256 =>
	transaction.instructions
		.filter(ins => ins.instructionType === InstructionType.UP)
		.map(ins => ins as Ins_UP)
		.filter(insUp => insUp.substate.substateType === SubStateType.TOKENS)
		.map(insUp => insUp.substate as TokensT)
		.filter(
			tokens =>
				tokens.resource.reAddressType ===
				REAddressType.RADIX_NATIVE_TOKEN,
		)
		.filter((xrdTokens): boolean => {
			const lhs = (xrdTokens.owner as REAddressPublicKey).publicKey.toString(
				true,
			)
			const isChangeBackToMe = lhs === myPublicKeyHex
			return !isChangeBackToMe
		})
		.map(xrdTokens => xrdTokens.amount)
		.reduce((prev, cur) => prev.add(cur), UInt256.valueOf(0))

const doTestParseTX = (testVector: TestVector): void => {
	const { blobHex, expected } = testVector
	const blob = Buffer.from(blobHex, 'hex')
	const txRes = Transaction.fromBuffer(blob)
	if (txRes.isErr()) {
		throw txRes.error
	}
	const parsedTx: TransactionT = txRes.value
	// console.log(parsedTx.toString())
	expect(parsedTx.toString()).toBe(expected.parsedTX)

	const hash = sha256Twice(blob)
	expect(hash.toString('hex')).toBe(expected.hash)

	const txFeeResult = calculateFeeOfTransaction(parsedTx)
	if (txFeeResult.isErr()) {
		console.error(
			`Failed to calculated tx fee, underlying error: ${msgFromError(
				txFeeResult.error,
			)}`,
		)
		return
	}
	const txFee = txFeeResult.value
	const xrdSentOut = amountOfXRDTransferredOutInTX(
		parsedTx,
		expected.myPublicKeyHex,
	)
	const totalXRDCost = txFee.add(xrdSentOut)

	expect(txFee.toString(10)).toBe(expected.txFee)
	expect(totalXRDCost.toString(10)).toBe(expected.totalXRDAmount)

	const c_unit_test_code_string_from_vector = generate_ledger_app_unit_test_c_code_from_test_vector({
		testVector,
		testName: expect.getState().currentTestName.split(' ')[1],
	})

	c_unit_tests_string = `${c_unit_tests_string}\n\n${c_unit_test_code_string_from_vector}`
}

describe('txParser', () => {
	afterAll(() => {
		// Use log below to output C unit tests string.
		// 	console.log(c_unit_tests_string)
	})

	it('xrd_transfer', () => {
		doTestParseTX({
			blobHex: '0d000107b4bfd245c716b406cccdb58596b965e6951af29571702270a9eba8e3362d150b00000000010021000000000000000000000000000000000000000000000000000101ed50bab1800002004506000403309a4981ca993d79ca165de3895fd9e44f809a03c977172884548112d139a73a0100000000000000000000000000000000000000000000d38be090e7bccda580000008000002004506000403309a4981ca993d79ca165de3895fd9e44f809a03c977172884548112d139a73a0100000000000000000000000000000000000000000000d355aac739f6ef0580000200450600040385be69c03154ba40a0a3ea8d06d31e256b1bdb4f6753543db88d2b173f4b5dfd0100000000000000000000000000000000000000000000003635c9adc5dea00000000b00234e8e56bb04ab91222579e882d7571418f8e97f03d280e84af6261a6873524e17a0f80f937701d36f51128947e117b18cb52b42350655ddb10a4b3c3415f224',
			expected: {
				parsedTX: `Instructions:
|- HEADER(0, 1)
|- DOWN(SubstateId { hash: 0xb4bfd245c716b406cccdb58596b965e6951af29571702270a9eba8e3362d150b, index: 0 })
|- SYSCALL(0x000000000000000000000000000000000000000000000000000101ed50bab18000)
|- UP(Tokens { reserved: 0, owner: 0x0403309a4981ca993d79ca165de3895fd9e44f809a03c977172884548112d139a73a, resource: 0x01, amount: U256 { raw: 998999607000000000000000 } })
|- END
|- LDOWN(0)
|- UP(Tokens { reserved: 0, owner: 0x0403309a4981ca993d79ca165de3895fd9e44f809a03c977172884548112d139a73a, resource: 0x01, amount: U256 { raw: 997999607000000000000000 } })
|- UP(Tokens { reserved: 0, owner: 0x040385be69c03154ba40a0a3ea8d06d31e256b1bdb4f6753543db88d2b173f4b5dfd, resource: 0x01, amount: U256 { raw: 1000000000000000000000 } })
|- END
|- SIG(0x00234e8e56bb04ab91222579e882d7571418f8e97f03d280e84af6261a6873524e17a0f80f937701d36f51128947e117b18cb52b42350655ddb10a4b3c3415f224)`,
				hash: 'ba49cfd87e82f91ee9f0e968475322bb7941006b7f3ef4753925a657dd38d286',
				myPublicKeyHex: '0356959464545aa2787984fe4ac76496721a22f150c0076724ad7190fe3a597bb7',
				txFee: '72600000000000000',
				totalXRDAmount: '1997999286600000000000000',
			},
		})
	})
	it('xrd_transfer_with_msg', () => {
		doTestParseTX({
			blobHex: '0d000107ba49cfd87e82f91ee9f0e968475322bb7941006b7f3ef4753925a657dd38d286000000010100210000000000000000000000000000000000000000000000000001079c81c255800002004506000403309a4981ca993d79ca165de3895fd9e44f809a03c977172884548112d139a73a0100000000000000000000000000000000000000000000d355a9bf9d752cb000000008000002004506000403309a4981ca993d79ca165de3895fd9e44f809a03c977172884548112d139a73a0100000000000000000000000000000000000000000000d355645c0bf2e7bc00000200450600040385be69c03154ba40a0a3ea8d06d31e256b1bdb4f6753543db88d2b173f4b5dfd010000000000000000000000000000000000000000000000004563918244f40000000c000548656c6c6f0b001695e237a5d7a0ffba78dee7163e8c6b8c4596fb95f376a07cbb4aa08bf6ba1d599d27f8ca1aa2b13d2c7172aa2684b0687ea211495890688fc19b9975510a7d',
			expected: {
				parsedTX: `Instructions:
|- HEADER(0, 1)
|- DOWN(SubstateId { hash: 0xba49cfd87e82f91ee9f0e968475322bb7941006b7f3ef4753925a657dd38d286, index: 1 })
|- SYSCALL(0x0000000000000000000000000000000000000000000000000001079c81c2558000)
|- UP(Tokens { reserved: 0, owner: 0x0403309a4981ca993d79ca165de3895fd9e44f809a03c977172884548112d139a73a, resource: 0x01, amount: U256 { raw: 997999532800000000000000 } })
|- END
|- LDOWN(0)
|- UP(Tokens { reserved: 0, owner: 0x0403309a4981ca993d79ca165de3895fd9e44f809a03c977172884548112d139a73a, resource: 0x01, amount: U256 { raw: 997994532800000000000000 } })
|- UP(Tokens { reserved: 0, owner: 0x040385be69c03154ba40a0a3ea8d06d31e256b1bdb4f6753543db88d2b173f4b5dfd, resource: 0x01, amount: U256 { raw: 5000000000000000000 } })
|- END
|- MSG(0x48656c6c6f)
|- SIG(0x001695e237a5d7a0ffba78dee7163e8c6b8c4596fb95f376a07cbb4aa08bf6ba1d599d27f8ca1aa2b13d2c7172aa2684b0687ea211495890688fc19b9975510a7d)`,
				hash: '0a44ddfbad1047458561e1d09489ac7666314c1f6d77c9523cf20c445a5dcf56',
				myPublicKeyHex: '0356959464545aa2787984fe4ac76496721a22f150c0076724ad7190fe3a597bb7',
				txFee: '74200000000000000',
				totalXRDAmount: '1995999139800000000000000',
			},
		})
	})

	it('other_transfer_mixed_tokens', () => {
		doTestParseTX({
			blobHex: '0d000107d71f8018869fb932ed4a463678d9c4e650c7e1f72cb7c61d82e16983d14a5f8c000000010100210000000000000000000000000000000000000000000000000001a831aada2e8000020045060004029f41bb89ffa243e86fb05d15c6e67c4b48f1bb2a19cd3ea1650bc50287cc0ffa0100000000000000000000000000000000000000000000d34a4147716d5def000000080000020045060004029f41bb89ffa243e86fb05d15c6e67c4b48f1bb2a19cd3ea1650bc50287cc0ffa0100000000000000000000000000000000000000000000d349fbe3dfeb18fb0000020045060004036af8f04dbb33483c1625465aa2b1401209fa11df02562e695f47bfe4a665e685010000000000000000000000000000000000000000000000004563918244f400000007bb2296555f1f1fc25dc85aeacc0feab2aef286d951e827e3b9d7b18538308cd00000000102005f060004029f41bb89ffa243e86fb05d15c6e67c4b48f1bb2a19cd3ea1650bc50287cc0ffa03cafbe65ab9e445ff25cdf9b4534a8dc6bdfa44c880758ce6c35b000000000000000000000000000000000000000000000000000000000000000502005f060004036af8f04dbb33483c1625465aa2b1401209fa11df02562e695f47bfe4a665e68503cafbe65ab9e445ff25cdf9b4534a8dc6bdfa44c880758ce6c35b0000000000000000000000000000000000000000000000000000000000000002000b0019edc25a02deff61e8eee3f2519cfaf751935c7c98ce0ed6b1c877a5903c79b158b530ebe4d3680ab7a14895169bd73620bea2372a52ca8afe7de210f12f2ff6',
			expected: {
				parsedTX: `Instructions:
|- HEADER(0, 1)
|- DOWN(SubstateId { hash: 0xd71f8018869fb932ed4a463678d9c4e650c7e1f72cb7c61d82e16983d14a5f8c, index: 1 })
|- SYSCALL(0x0000000000000000000000000000000000000000000000000001a831aada2e8000)
|- UP(Tokens { reserved: 0, owner: 0x04029f41bb89ffa243e86fb05d15c6e67c4b48f1bb2a19cd3ea1650bc50287cc0ffa, resource: 0x01, amount: U256 { raw: 997789090800000000000000 } })
|- END
|- LDOWN(0)
|- UP(Tokens { reserved: 0, owner: 0x04029f41bb89ffa243e86fb05d15c6e67c4b48f1bb2a19cd3ea1650bc50287cc0ffa, resource: 0x01, amount: U256 { raw: 997784090800000000000000 } })
|- UP(Tokens { reserved: 0, owner: 0x04036af8f04dbb33483c1625465aa2b1401209fa11df02562e695f47bfe4a665e685, resource: 0x01, amount: U256 { raw: 5000000000000000000 } })
|- END
|- DOWN(SubstateId { hash: 0xbb2296555f1f1fc25dc85aeacc0feab2aef286d951e827e3b9d7b18538308cd0, index: 1 })
|- UP(Tokens { reserved: 0, owner: 0x04029f41bb89ffa243e86fb05d15c6e67c4b48f1bb2a19cd3ea1650bc50287cc0ffa, resource: 0x03cafbe65ab9e445ff25cdf9b4534a8dc6bdfa44c880758ce6c35b, amount: U256 { raw: 5 } })
|- UP(Tokens { reserved: 0, owner: 0x04036af8f04dbb33483c1625465aa2b1401209fa11df02562e695f47bfe4a665e685, resource: 0x03cafbe65ab9e445ff25cdf9b4534a8dc6bdfa44c880758ce6c35b, amount: U256 { raw: 2 } })
|- END
|- SIG(0x0019edc25a02deff61e8eee3f2519cfaf751935c7c98ce0ed6b1c877a5903c79b158b530ebe4d3680ab7a14895169bd73620bea2372a52ca8afe7de210f12f2ff6)`,
				hash: '9335840aa4d08ed3691d1d6c641c0bdea9dfc707fdd0a984e078203a73493ef6',
				myPublicKeyHex:
					'0356959464545aa2787984fe4ac76496721a22f150c0076724ad7190fe3a597bb7',
				txFee: '119400000000000000',
				totalXRDAmount: '1995578301000000000000000',
			},
		})
	})

	it('other_transfer_to_self', () => {
		doTestParseTX({
			blobHex: '0d0001071c5adcb82ecf26e963e76dec2f38fff11ae377f7c28f9f731d9540c1aa86a53100000000010021000000000000000000000000000000000000000000000000000101ed50bab18000020045060004029f41bb89ffa243e86fb05d15c6e67c4b48f1bb2a19cd3ea1650bc50287cc0ffa0100000000000000000000000000000000000000000000d34a8853349a7d11800000080000020045060004029f41bb89ffa243e86fb05d15c6e67c4b48f1bb2a19cd3ea1650bc50287cc0ffa0100000000000000000000000000000000000000000000d34a42efa318381d8000020045060004029f41bb89ffa243e86fb05d15c6e67c4b48f1bb2a19cd3ea1650bc50287cc0ffa010000000000000000000000000000000000000000000000004563918244f40000000b0099a36704279db19e3b13b13a49895eb572a02479383616eecb26d16864c4abcf5397a9c12776902b62ac48c29ed8dc334f03a990bb8515a6db78e56a1f27d721',
			expected: {
				parsedTX: `Instructions:
|- HEADER(0, 1)
|- DOWN(SubstateId { hash: 0x1c5adcb82ecf26e963e76dec2f38fff11ae377f7c28f9f731d9540c1aa86a531, index: 0 })
|- SYSCALL(0x000000000000000000000000000000000000000000000000000101ed50bab18000)
|- UP(Tokens { reserved: 0, owner: 0x04029f41bb89ffa243e86fb05d15c6e67c4b48f1bb2a19cd3ea1650bc50287cc0ffa, resource: 0x01, amount: U256 { raw: 997794210200000000000000 } })
|- END
|- LDOWN(0)
|- UP(Tokens { reserved: 0, owner: 0x04029f41bb89ffa243e86fb05d15c6e67c4b48f1bb2a19cd3ea1650bc50287cc0ffa, resource: 0x01, amount: U256 { raw: 997789210200000000000000 } })
|- UP(Tokens { reserved: 0, owner: 0x04029f41bb89ffa243e86fb05d15c6e67c4b48f1bb2a19cd3ea1650bc50287cc0ffa, resource: 0x01, amount: U256 { raw: 5000000000000000000 } })
|- END
|- SIG(0x0099a36704279db19e3b13b13a49895eb572a02479383616eecb26d16864c4abcf5397a9c12776902b62ac48c29ed8dc334f03a990bb8515a6db78e56a1f27d721)`,
				hash: 'd71f8018869fb932ed4a463678d9c4e650c7e1f72cb7c61d82e16983d14a5f8c',
				myPublicKeyHex:
					'02935deebcad35bcf27d05b431276be8fcba26312cd1d54c33ac6748a72fe427ca',
				txFee: '72600000000000000',
				totalXRDAmount: '1995588493000000000000000',
			},
		})
	})

 it('token_transfer_and_stake', () => {
		doTestParseTX({
			blobHex: '0d0001076a950e22681f3db30ab6fd4714815443fb680249ea07d65adee004a46a80daac0000000001002100000000000000000000000000000000000000000000000000017efb8762c980000200450600040385be69c03154ba40a0a3ea8d06d31e256b1bdb4f6753543db88d2b173f4b5dfd01000000000000000000000000000000000000000000000036326a5e8f76348000000800000200450600040385be69c03154ba40a0a3ea8d06d31e256b1bdb4f6753543db88d2b173f4b5dfd0100000000000000000000000000000000000000000000002b5adba234b014800005004529f251379200c559e01b8e3fb7b4c7cf9bf23279dc6ebd26ba20a5f4e88c772e000000050385be69c03154ba40a0a3ea8d06d31e256b1bdb4f6753543db88d2b173f4b5dfd05004529f251379200c559e01b8e3fb7b4c7cf9bf23279dc6ebd26ba20a5f4e88c772e000000080385be69c03154ba40a0a3ea8d06d31e256b1bdb4f6753543db88d2b173f4b5dfd02006507000385be69c03154ba40a0a3ea8d06d31e256b1bdb4f6753543db88d2b173f4b5dfd040385be69c03154ba40a0a3ea8d06d31e256b1bdb4f6753543db88d2b173f4b5dfd00000000000000000000000000000000000000000000000ad78ebc5ac6200000000b0094a8feb4342b299349a89e2c3829dd594a6c8bafed54f710490a676ad558d0f40892c5d0bbac5849b0fe814e0cb578367178bf297a9114686a1e967da1e7e8e1',
			expected: {
				parsedTX: `Instructions:
|- HEADER(0, 1)
|- DOWN(SubstateId { hash: 0x6a950e22681f3db30ab6fd4714815443fb680249ea07d65adee004a46a80daac, index: 0 })
|- SYSCALL(0x00000000000000000000000000000000000000000000000000017efb8762c98000)
|- UP(Tokens { reserved: 0, owner: 0x040385be69c03154ba40a0a3ea8d06d31e256b1bdb4f6753543db88d2b173f4b5dfd, resource: 0x01, amount: U256 { raw: 999757000000000000000 } })
|- END
|- LDOWN(0)
|- UP(Tokens { reserved: 0, owner: 0x040385be69c03154ba40a0a3ea8d06d31e256b1bdb4f6753543db88d2b173f4b5dfd, resource: 0x01, amount: U256 { raw: 799757000000000000000 } })
|- VREAD(0x29f251379200c559e01b8e3fb7b4c7cf9bf23279dc6ebd26ba20a5f4e88c772e000000050385be69c03154ba40a0a3ea8d06d31e256b1bdb4f6753543db88d2b173f4b5dfd)
|- VREAD(0x29f251379200c559e01b8e3fb7b4c7cf9bf23279dc6ebd26ba20a5f4e88c772e000000080385be69c03154ba40a0a3ea8d06d31e256b1bdb4f6753543db88d2b173f4b5dfd)
|- UP(PreparedStake { reserved: 0, validator: 0x0385be69c03154ba40a0a3ea8d06d31e256b1bdb4f6753543db88d2b173f4b5dfd, owner: 0x040385be69c03154ba40a0a3ea8d06d31e256b1bdb4f6753543db88d2b173f4b5dfd, amount: U256 { raw: 200000000000000000000 } })
|- END
|- SIG(0x0094a8feb4342b299349a89e2c3829dd594a6c8bafed54f710490a676ad558d0f40892c5d0bbac5849b0fe814e0cb578367178bf297a9114686a1e967da1e7e8e1)`,
				hash: '58d46b950af3040bdf0026d2c9b67d6ee026e90d6b6ab4324b99385c619e9990',
				myPublicKeyHex:
					'0356959464545aa2787984fe4ac76496721a22f150c0076724ad7190fe3a597bb7',
				txFee: '72600000000000000',
				totalXRDAmount: '1999927400000000000000',
			},
		})
	})
})
