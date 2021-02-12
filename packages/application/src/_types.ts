import { AnyUpParticle, Atom } from '@radixdlt/atom'
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

export type TokenFeeProvider = Readonly<{
	feeFor: (input: Readonly<{ atom: Atom }>) => Result<Amount, Error>
}>
