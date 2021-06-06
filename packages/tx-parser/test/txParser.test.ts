import { Transaction } from '../src/transaction'
import { InstructionType, TransactionT } from '../src'

describe('txParser', () => {
	// describe('parse blobs', () => {
	// 	describe('containing tokentransfer', () => {
			it('single transfer', () => {
				const blobHex = '04ace518e61b07f95c1fe16e120cc0691f9514f1fee21b0dac44e637453f538bbf00000003010303c81161158edfd37cfee329ff957c1e31c9f45841549a3e3f88290403cc5a7e43d9e1174171a55b6c0ba8c1ad1693abd0c734d8782e8525e09b6c757a0000000000000000000000000000000000000000000000000000000000000004010303c81161158edfd37cfee329ff957c1e31c9f45841549a3e3f882904021889ddebe74830d9a4714ef07f57d146ef925b9b436f223486bfcc6e9ea00a090000000000000000000000000000000000000000000000000000000000000006000701773f2aed8a8fe5a4614936dbc0c37dfc95fd97c899122ba3afd17cb2a9dd1f3b1cb7c9649741081470757011cecbe48c546398c61cab7c4b74640744865b7bda'
				console.log(`🔮 trying to parse tx from blob:\n'0x${blobHex}'\n`)
				const blob = Buffer.from(blobHex, 'hex')
				const txRes = Transaction.fromBuffer(blob)
				console.log(`✅ finished parsing tx from blob`)
				if (txRes.isErr()) {
					throw txRes.error
				}
				const parsedTx: TransactionT = txRes.value

				/*
|- DOWN(SubstateId { hash: 0xace518e61b07f95c1fe16e120cc0691f9514f1fee21b0dac44e637453f538bbf, index: 3 })
|- UP(Tokens { rri: 0x03c81161158edfd37cfee329ff957c1e31c9f45841549a3e3f8829, owner: 0x0403cc5a7e43d9e1174171a55b6c0ba8c1ad1693abd0c734d8782e8525e09b6c757a, amount: U256 { raw: 4 } })
|- UP(Tokens { rri: 0x03c81161158edfd37cfee329ff957c1e31c9f45841549a3e3f8829, owner: 0x04021889ddebe74830d9a4714ef07f57d146ef925b9b436f223486bfcc6e9ea00a09, amount: U256 { raw: 6 } })
|- END
|- SIG(0x01773f2aed8a8fe5a4614936dbc0c37dfc95fd97c899122ba3afd17cb2a9dd1f3b1cb7c9649741081470757011cecbe48c546398c61cab7c4b74640744865b7bda)

				* */
				expect(parsedTx.instructions.length).toBe(5)
				expect(parsedTx.instructions
					.map(i => i.instructionType)
					.map(it => InstructionType[it])
				).toStrictEqual([
					'DOWN', 'UP', 'UP', 'END', 'SIG'
				])
			})
		// })
	// })
})