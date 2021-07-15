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
	const blob = Buffer.from('0d000107fe0612646562ffe67a61fa5b35924048b8a319433df0fc8813b94d07fddfe12d00000002010021000000000000000000000000000000000000000000000000000101ed50bab1800002004506000403f43fba6541031ef2195f5ba96677354d28147e45b40cde4662bec9162c361f550100000000000000000000000000000000000000000000003634c7c07523ee80000008000002004506000403f43fba6541031ef2195f5ba96677354d28147e45b40cde4662bec9162c361f5501000000000000000000000000000000000000000000000030c9006247c0de800002004506000402938e6dad141fc9c2e71566c4911052aed27b6951f31b6c792ceb2665a5fe642a010000000000000000000000000000000000000000000000056bc75e2d6310000000', 'hex')
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

	it('token_transfer_only_xrd', () => {
		doTestParseTX({
			blobHex: '0d000107fe0612646562ffe67a61fa5b35924048b8a319433df0fc8813b94d07fddfe12d00000002010021000000000000000000000000000000000000000000000000000101ed50bab1800002004506000403f43fba6541031ef2195f5ba96677354d28147e45b40cde4662bec9162c361f550100000000000000000000000000000000000000000000003634c7c07523ee80000008000002004506000403f43fba6541031ef2195f5ba96677354d28147e45b40cde4662bec9162c361f5501000000000000000000000000000000000000000000000030c9006247c0de800002004506000402938e6dad141fc9c2e71566c4911052aed27b6951f31b6c792ceb2665a5fe642a010000000000000000000000000000000000000000000000056bc75e2d6310000000',
			expected: {
				parsedTX: `Instructions:
|- HEADER(0, 1)
|- DOWN(SubstateId { hash: 0xa0686a487f9d3adf4892a358e4460cda432068f069e5e9f4c815af21bc3dd1d6, index: 0 })
|- SYSCALL(0x00000000000000000000000000000000000000000000000abbade0b6b3a7640000)
|- UP(Tokens { reserved: 0, owner: 0x0402935deebcad35bcf27d05b431276be8fcba26312cd1d54c33ac6748a72fe427ca, resource: 0x01, amount: U256 { raw: 999996000000000000000000 } })
|- END
|- LDOWN(0)
|- UP(Tokens { reserved: 0, owner: 0x0402935deebcad35bcf27d05b431276be8fcba26312cd1d54c33ac6748a72fe427ca, resource: 0x01, amount: U256 { raw: 998996000000000000000000 } })
|- UP(Tokens { reserved: 0, owner: 0x040356959464545aa2787984fe4ac76496721a22f150c0076724ad7190fe3a597bb7, resource: 0x01, amount: U256 { raw: 1000000000000000000000 } })
|- END
|- SYSCALL(0x010000000000000000000000000000000000000000000000000de0b6b3a7640000)
|- UP(Tokens { reserved: 0, owner: 0x0402935deebcad35bcf27d05b431276be8fcba26312cd1d54c33ac6748a72fe427ca, resource: 0x01, amount: U256 { raw: 1000000000000000000 } })
|- END`,
				hash: '81dbeb1074eaa5c5dd93de90a25db9da4b1ccbe3a2c264a30dd81b0849d32386',
				myPublicKeyHex: '0356959464545aa2787984fe4ac76496721a22f150c0076724ad7190fe3a597bb7',
				txFee: '50684735185526206758912',
				totalXRDAmount: '2049677735185526206758912',
			},
		})
	})
	it('token_transfer_only_xrd_with_msg', () => {
		doTestParseTX({
			blobHex: '0d000107973b739777f86d706b1ff85aaab35065e8de03da0fe83bbedf30a0acc0ec4ea500000001012100000000000000000000000000000000000000000000000deadde0b6b3a76400000206000402935deebcad35bcf27d05b431276be8fcba26312cd1d54c33ac6748a72fe427ca0100000000000000000000000000000000000000000000d38ba0a18da57d6c00000008000000000206000402935deebcad35bcf27d05b431276be8fcba26312cd1d54c33ac6748a72fe427ca0100000000000000000000000000000000000000000000d38b5b3dfc2338780000020600040356959464545aa2787984fe4ac76496721a22f150c0076724ad7190fe3a597bb7010000000000000000000000000000000000000000000000004563918244f40000000121010000000000000000000000000000000000000000000000000de0b6b3a76400000206000402935deebcad35bcf27d05b431276be8fcba26312cd1d54c33ac6748a72fe427ca010000000000000000000000000000000000000000000000000de0b6b3a7640000000c0548656c6c6f',
			expected: {
				parsedTX: `Instructions:
|- HEADER(0, 1)
|- DOWN(SubstateId { hash: 0x973b739777f86d706b1ff85aaab35065e8de03da0fe83bbedf30a0acc0ec4ea5, index: 1 })
|- SYSCALL(0x00000000000000000000000000000000000000000000000deadde0b6b3a7640000)
|- UP(Tokens { reserved: 0, owner: 0x0402935deebcad35bcf27d05b431276be8fcba26312cd1d54c33ac6748a72fe427ca, resource: 0x01, amount: U256 { raw: 998995000000000000000000 } })
|- END
|- LDOWN(0)
|- UP(Tokens { reserved: 0, owner: 0x0402935deebcad35bcf27d05b431276be8fcba26312cd1d54c33ac6748a72fe427ca, resource: 0x01, amount: U256 { raw: 998990000000000000000000 } })
|- UP(Tokens { reserved: 0, owner: 0x040356959464545aa2787984fe4ac76496721a22f150c0076724ad7190fe3a597bb7, resource: 0x01, amount: U256 { raw: 5000000000000000000 } })
|- END
|- SYSCALL(0x010000000000000000000000000000000000000000000000000de0b6b3a7640000)
|- UP(Tokens { reserved: 0, owner: 0x0402935deebcad35bcf27d05b431276be8fcba26312cd1d54c33ac6748a72fe427ca, resource: 0x01, amount: U256 { raw: 1000000000000000000 } })
|- END
|- MSG(0x48656c6c6f)`,
				hash: '4cf20c1179787beb721e201e6da5ead64e6425c8532c7b5315cb743514bd7241',
				myPublicKeyHex: '0356959464545aa2787984fe4ac76496721a22f150c0076724ad7190fe3a597bb7',
				txFee: '65722290370113311866880',
				totalXRDAmount: '2063708290370113311866880',
			},
		})
	})

	it('token_transfer_xrd_and_non_xrd_mixed', () => {
		doTestParseTX({
			blobHex: '0d0001076ae6ca1c740d4b7d1a9d07ddad52ca62226851ac9f595e390a6e5ab3bf4f626b00000003012100000000000000000000000000000000000000000000000abbade0b6b3a76400000007973b739777f86d706b1ff85aaab35065e8de03da0fe83bbedf30a0acc0ec4ea50000000307a0686a487f9d3adf4892a358e4460cda432068f069e5e9f4c815af21bc3dd1d60000000307b1f4197b20e6c64bee1f751b76a779293481c910f413c0fcafc0b993e10b1371000000000206000402935deebcad35bcf27d05b431276be8fcba26312cd1d54c33ac6748a72fe427ca0100000000000000000000000000000000000000000000d37ff8e81cc3e8700000020600040356959464545aa2787984fe4ac76496721a22f150c0076724ad7190fe3a597bb7010000000000000000000000000000000000000000000000004563918244f400000007c809308c578cbb2dc9e38ad49f9ac6b15826be4870bd5995e4e1872c3f0abe2a000000000206000402935deebcad35bcf27d05b431276be8fcba26312cd1d54c33ac6748a72fe427ca039aee5d3daebf6b132c0c58b241f25f198ddcac69421759cb1c920000000000000000000000000000000000000000000000000000000000000005020600040356959464545aa2787984fe4ac76496721a22f150c0076724ad7190fe3a597bb7039aee5d3daebf6b132c0c58b241f25f198ddcac69421759cb1c920000000000000000000000000000000000000000000000000000000000000002000121010000000000000000000000000000000000000000000000000de0b6b3a76400000206000402935deebcad35bcf27d05b431276be8fcba26312cd1d54c33ac6748a72fe427ca010000000000000000000000000000000000000000000000000de0b6b3a764000000',
			expected: {
				parsedTX: `Instructions:
|- HEADER(0, 1)
|- DOWN(SubstateId { hash: 0x6ae6ca1c740d4b7d1a9d07ddad52ca62226851ac9f595e390a6e5ab3bf4f626b, index: 3 })
|- SYSCALL(0x00000000000000000000000000000000000000000000000abbade0b6b3a7640000)
|- END
|- DOWN(SubstateId { hash: 0x973b739777f86d706b1ff85aaab35065e8de03da0fe83bbedf30a0acc0ec4ea5, index: 3 })
|- DOWN(SubstateId { hash: 0xa0686a487f9d3adf4892a358e4460cda432068f069e5e9f4c815af21bc3dd1d6, index: 3 })
|- DOWN(SubstateId { hash: 0xb1f4197b20e6c64bee1f751b76a779293481c910f413c0fcafc0b993e10b1371, index: 0 })
|- UP(Tokens { reserved: 0, owner: 0x0402935deebcad35bcf27d05b431276be8fcba26312cd1d54c33ac6748a72fe427ca, resource: 0x01, amount: U256 { raw: 998780000000000000000000 } })
|- UP(Tokens { reserved: 0, owner: 0x040356959464545aa2787984fe4ac76496721a22f150c0076724ad7190fe3a597bb7, resource: 0x01, amount: U256 { raw: 5000000000000000000 } })
|- END
|- DOWN(SubstateId { hash: 0xc809308c578cbb2dc9e38ad49f9ac6b15826be4870bd5995e4e1872c3f0abe2a, index: 0 })
|- UP(Tokens { reserved: 0, owner: 0x0402935deebcad35bcf27d05b431276be8fcba26312cd1d54c33ac6748a72fe427ca, resource: 0x039aee5d3daebf6b132c0c58b241f25f198ddcac69421759cb1c92, amount: U256 { raw: 5 } })
|- UP(Tokens { reserved: 0, owner: 0x040356959464545aa2787984fe4ac76496721a22f150c0076724ad7190fe3a597bb7, resource: 0x039aee5d3daebf6b132c0c58b241f25f198ddcac69421759cb1c92, amount: U256 { raw: 2 } })
|- END
|- SYSCALL(0x010000000000000000000000000000000000000000000000000de0b6b3a7640000)
|- UP(Tokens { reserved: 0, owner: 0x0402935deebcad35bcf27d05b431276be8fcba26312cd1d54c33ac6748a72fe427ca, resource: 0x01, amount: U256 { raw: 1000000000000000000 } })
|- END`,
				hash: '87d48350faf0b54c850ed195a3635b3732f211623907c8b598b4620bf9d02f62',
				myPublicKeyHex:
					'0356959464545aa2787984fe4ac76496721a22f150c0076724ad7190fe3a597bb7',
				txFee: '50684735185526206758912',
				totalXRDAmount: '1049465735185526206758912',
			},
		})
	})

	it('xrd_transfer_to_self', () => {
		doTestParseTX({
			blobHex: '0d0001070c7e6ad291944d3fdf50cd278651e4d20ad28536b529004008a4c3938dce092c00000003012100000000000000000000000000000000000000000000000abbade0b6b3a764000000076ae6ca1c740d4b7d1a9d07ddad52ca62226851ac9f595e390a6e5ab3bf4f626b000000000206000402935deebcad35bcf27d05b431276be8fcba26312cd1d54c33ac6748a72fe427ca0100000000000000000000000000000000000000000000d380228a40dede9c00000206000402935deebcad35bcf27d05b431276be8fcba26312cd1d54c33ac6748a72fe427ca010000000000000000000000000000000000000000000000004563918244f40000000121010000000000000000000000000000000000000000000000000de0b6b3a76400000206000402935deebcad35bcf27d05b431276be8fcba26312cd1d54c33ac6748a72fe427ca010000000000000000000000000000000000000000000000000de0b6b3a764000000',
			expected: {
				parsedTX: `Instructions:
|- HEADER(0, 1)
|- DOWN(SubstateId { hash: 0x0c7e6ad291944d3fdf50cd278651e4d20ad28536b529004008a4c3938dce092c, index: 3 })
|- SYSCALL(0x00000000000000000000000000000000000000000000000abbade0b6b3a7640000)
|- END
|- DOWN(SubstateId { hash: 0x6ae6ca1c740d4b7d1a9d07ddad52ca62226851ac9f595e390a6e5ab3bf4f626b, index: 0 })
|- UP(Tokens { reserved: 0, owner: 0x0402935deebcad35bcf27d05b431276be8fcba26312cd1d54c33ac6748a72fe427ca, resource: 0x01, amount: U256 { raw: 998783000000000000000000 } })
|- UP(Tokens { reserved: 0, owner: 0x0402935deebcad35bcf27d05b431276be8fcba26312cd1d54c33ac6748a72fe427ca, resource: 0x01, amount: U256 { raw: 5000000000000000000 } })
|- END
|- SYSCALL(0x010000000000000000000000000000000000000000000000000de0b6b3a7640000)
|- UP(Tokens { reserved: 0, owner: 0x0402935deebcad35bcf27d05b431276be8fcba26312cd1d54c33ac6748a72fe427ca, resource: 0x01, amount: U256 { raw: 1000000000000000000 } })
|- END`,
				hash: 'a02f6696f1aa5dc389f028784f01f157596a7aae38ed01b7c0899bd53de24271',
				myPublicKeyHex:
					'02935deebcad35bcf27d05b431276be8fcba26312cd1d54c33ac6748a72fe427ca',
				txFee: '50684735185526206758912',
				totalXRDAmount: '50684735185526206758912',
			},
		})
	})

 it('token_transfer_and_stake', () => {
		doTestParseTX({
			blobHex: '0d0001070c7e6ad291944d3fdf50cd278651e4d20ad28536b529004008a4c3938dce092c00000001012100000000000000000000000000000000000000000000000abbade0b6b3a76400000206000402935deebcad35bcf27d05b431276be8fcba26312cd1d54c33ac6748a72fe427ca0100000000000000000000000000000000000000000000d38b4d5d456f911400000008000000000206000402935deebcad35bcf27d05b431276be8fcba26312cd1d54c33ac6748a72fe427ca0100000000000000000000000000000000000000000000d38075ce8914caf4000003af99885ac063393a2849d4b0df36c5ec3164408132526caf59f53d1239be2bf8000000000207000356959464545aa2787984fe4ac76496721a22f150c0076724ad7190fe3a597bb70402935deebcad35bcf27d05b431276be8fcba26312cd1d54c33ac6748a72fe427ca00000000000000000000000000000000000000000000000ad78ebc5ac6200000000121010000000000000000000000000000000000000000000000000de0b6b3a76400000206000402935deebcad35bcf27d05b431276be8fcba26312cd1d54c33ac6748a72fe427ca010000000000000000000000000000000000000000000000000de0b6b3a764000000',
			expected: {
				parsedTX: `Instructions:
|- HEADER(0, 1)
|- DOWN(SubstateId { hash: 0x0c7e6ad291944d3fdf50cd278651e4d20ad28536b529004008a4c3938dce092c, index: 1 })
|- SYSCALL(0x00000000000000000000000000000000000000000000000abbade0b6b3a7640000)
|- UP(Tokens { reserved: 0, owner: 0x0402935deebcad35bcf27d05b431276be8fcba26312cd1d54c33ac6748a72fe427ca, resource: 0x01, amount: U256 { raw: 998989000000000000000000 } })
|- END
|- LDOWN(0)
|- UP(Tokens { reserved: 0, owner: 0x0402935deebcad35bcf27d05b431276be8fcba26312cd1d54c33ac6748a72fe427ca, resource: 0x01, amount: U256 { raw: 998789000000000000000000 } })
|- READ(SubstateId { hash: 0xaf99885ac063393a2849d4b0df36c5ec3164408132526caf59f53d1239be2bf8, index: 0 })
|- UP(PreparedStake { reserved: 0, validator: 0x0356959464545aa2787984fe4ac76496721a22f150c0076724ad7190fe3a597bb7, owner: 0x0402935deebcad35bcf27d05b431276be8fcba26312cd1d54c33ac6748a72fe427ca, amount: U256 { raw: 200000000000000000000 } })
|- END
|- SYSCALL(0x010000000000000000000000000000000000000000000000000de0b6b3a7640000)
|- UP(Tokens { reserved: 0, owner: 0x0402935deebcad35bcf27d05b431276be8fcba26312cd1d54c33ac6748a72fe427ca, resource: 0x01, amount: U256 { raw: 1000000000000000000 } })
|- END`,
				hash: 'c654e3f75dc64922309ea0e0ca11a2fbbf377f75e462bf62637495de0f66d32a',
				myPublicKeyHex:
					'0356959464545aa2787984fe4ac76496721a22f150c0076724ad7190fe3a597bb7',
				txFee: '50684735185526206758912',
				totalXRDAmount: '2048463735185526206758912',
			},
		})
	})
})
