import { v4 as uuidv4 } from 'uuid'
import { Decoder, JSONDecoding } from '@radixdlt/data-formats'
import { isObject } from '@radixdlt/util'
import { ok } from 'neverthrow'
import { Amount, AmountT, isAmount } from '@radixdlt/primitives'
import { Address, AddressT } from '@radixdlt/account'
import {
	ActionType,
	ExecutedTransferTokensAction,
	IntendedTransferTokensAction,
	IntendedTransferTokensInput,
} from './_types'
import {
	isResourceIdentifier,
	ResourceIdentifier,
} from '../dto/resourceIdentifier'

const __isExecTx = (
	something: unknown,
): something is ExecutedTransferTokensAction => {
	const inspection = something as ExecutedTransferTokensAction
	const isExecTx =
		Address.isAddress(inspection.from) &&
		Address.isAddress(inspection.to) &&
		isAmount(inspection.amount) &&
		isResourceIdentifier(inspection.resourceIdentifier)

	if (isExecTx) {
		console.log(`🔮 isExecTx 🎉 🎉`)
	} else {
		console.log(`🚩 is not exec tx: ${JSON.stringify(something, null, 4)}`)
	}
	return isExecTx
}

const JSONDecoder: Decoder = (value) =>
	isObject(value) && value['type'] === ActionType.TOKEN_TRANSFER
		? // ? ok(executed(value as RawTransferAction))
		  __isExecTx(value)
			? ok(value)
			: undefined
		: undefined

const decoding = JSONDecoding.withDependencies(
	ResourceIdentifier,
	Amount,
	Address,
)
	.withDecoders(JSONDecoder)
	.create()

const intended = (
	input: IntendedTransferTokensInput,
): IntendedTransferTokensAction => {
	const uuid = input.uuid ?? uuidv4()

	return {
		actionType: ActionType.TOKEN_TRANSFER,
		to: input.to,
		from: input.from,
		resourceIdentifier: input.resourceIdentifier,
		amount: input.amount,
		uuid: uuid,
	}
}

// const executed = (
// 	raw: RawTransferAction
// ): ExecutedTransferTokensAction => {
// 	return {
// 		from: raw.from
// 		to: AddressT
// 		amount: AmountT
// 		resourceIdentifier: ResourceIdentifierT
// 	}
// }

export const TransferTokensAction = {
	intended,
	...decoding,
	JSONDecoder,
}
