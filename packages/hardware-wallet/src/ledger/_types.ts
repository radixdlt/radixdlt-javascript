import { Observable } from 'rxjs'
import { LedgerInstruction } from '../_types'
import { APDUT } from './wrapped'

export type CreateLedgerNanoTransportInput = Readonly<{
	openTimeout?: number
	listenTimeout?: number
}>

export const radixCLA: number = 0xaa

export type RadixAPDUT = APDUT &
	Readonly<{
		// (type: 'number') Always to '0xAA'
		cla: typeof radixCLA
		ins: LedgerInstruction
	}>

export type LedgerNanoT = Readonly<{
	sendAPDUCommandToDevice: (
		input: Readonly<{
			apdu: RadixAPDUT
		}>,
	) => Observable<Buffer>
}>
