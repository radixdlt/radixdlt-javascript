import { Transaction } from '../src/transaction'
import { InstructionType, TransactionT } from '../src'
import {
	Ins_DOWN,
	Ins_END,
	Ins_LDOWN,
	Ins_SIG,
	Ins_UP,
	PreparedStakeT,
	SubStateType,
	TokensT,
} from '../dist'

describe('txParser', () => {
	describe('parse blobs', () => {
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
					ins
						.map(i => i.instructionType)
						.map(it => InstructionType[it]),
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
					ins
						.map(i => i.instructionType)
						.map(it => InstructionType[it]),
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
				expect(transfer0.rri.toBuffer().toString('hex')).toBe(
					expectedRRI,
				)
				expect(transfer0.owner.toBuffer().toString('hex')).toBe(
					'0403cc5a7e43d9e1174171a55b6c0ba8c1ad1693abd0c734d8782e8525e09b6c757a',
				)

				const i2UP = ins[2] as Ins_UP
				expect(i2UP.instructionType).toBe(InstructionType.UP)
				expect(i2UP.substate.substateType).toBe(SubStateType.TOKENS)
				const transfer1 = i2UP.substate as TokensT
				expect(transfer1.amount.valueOf()).toBe(6)
				expect(transfer1.rri.toBuffer().toString('hex')).toBe(
					expectedRRI,
				)
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

			it('with fee', () => {
				const blobHex =
					'049fe3dcbcf98105da0c4b1769f8c46ad6174346d87c4d33a338c3f925b1965741000000070103010403453a3c16c42f41def4621b6613091537eb8e246ca1e9c2e1d5834c13806fda330000000000000000000000000000000000000000204fce5e3e2502610ffffff701030104036f18d1c8079b14f2e1c291d697dc878f7f3c9c779c4506718d19e83510882c4900000000000000000000000000000000000000000000000000000000000000090005000000010103010403453a3c16c42f41def4621b6613091537eb8e246ca1e9c2e1d5834c13806fda330000000000000000000000000000000000000000204fce5e3cc1bce8b275fff70007000178b896c81f8313f98a42f558c2eadc1396d8b9c9445332878b2aa4f8db58134154c229beea67722f7cdecf05857b006935dcd3ee1a7945a50db486cc134915'
				const blob = Buffer.from(blobHex, 'hex')
				const txRes = Transaction.fromBuffer(blob)
				if (txRes.isErr()) {
					throw txRes.error
				}
				const parsedTx: TransactionT = txRes.value
				console.log(`✅ parsed tx: ${parsedTx.toString()}`)
				expect(parsedTx.toBuffer().toString('hex')).toBe(blobHex)

				const ins = parsedTx.instructions

				expect(ins.length).toBe(8)
				expect(
					ins
						.map(i => i.instructionType)
						.map(it => InstructionType[it]),
				).toStrictEqual([
					'DOWN',
					'UP',
					'UP',
					'END',
					'LDOWN',
					'UP',
					'END',
					'SIG',
				])

				const i0_DOWN = ins[0] as Ins_DOWN
				expect(i0_DOWN.substateId.index).toBe(7)
				const i1_UP = ins[1] as Ins_UP
				expect(i1_UP.substate.substateType).toBe(SubStateType.TOKENS)
				const tokens0 = i1_UP.substate as TokensT
				expect(tokens0.amount.toString()).toBe(
					'9999999999999999999999999991',
				)

				const i2_UP = ins[2] as Ins_UP
				expect(i2_UP.substate.substateType).toBe(SubStateType.TOKENS)
				const tokens1 = i2_UP.substate as TokensT
				expect(tokens1.amount.toString()).toBe('9')

				const i3_END = ins[3] as Ins_END
				const i4_LDOWN = ins[4] as Ins_LDOWN
				const i5_UP = ins[5] as Ins_UP
				expect(i5_UP.substate.substateType).toBe(SubStateType.TOKENS)
				const tokens2 = i5_UP.substate as TokensT
				expect(tokens2.amount.toString()).toBe(
					'9999999999899999999999999991',
				)

				const i6_END = ins[6] as Ins_END
				const i7_SIG = ins[7] as Ins_SIG
			})
		})
	})
})
