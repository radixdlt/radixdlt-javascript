import { AnyUpParticle } from '@radixdlt/atom'
import { Amount } from '@radixdlt/primitives'
import { Result } from 'neverthrow'

export type FeeEntry = Readonly<{
	feeFor: (
		input: Readonly<{
			upParticles: AnyUpParticle[]
			atomByteCount: number
		}>,
	) => Result<Amount, Error>
}>

export type TokenFeeTable = Readonly<{
	minimumFee: Amount
	feeEntries: FeeEntry[]
}>
