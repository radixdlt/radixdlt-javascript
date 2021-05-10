import { LedgerInstruction } from '../_types'
import { err, ok, Result } from 'neverthrow'

export const ledgerInstruction = (
	ins: number,
): Result<LedgerInstruction, Error> => {
	if (ins === LedgerInstruction.GET_PUBLIC_KEY) {
		return ok(LedgerInstruction.GET_PUBLIC_KEY)
	} else if (ins === LedgerInstruction.GET_VERSION) {
		return ok(LedgerInstruction.GET_VERSION)
	} else if (ins === LedgerInstruction.DO_KEY_EXCHANGE) {
		return ok(LedgerInstruction.DO_KEY_EXCHANGE)
	}
	return err(new Error(`Unrecognized instruction: ${ins}`))
}
