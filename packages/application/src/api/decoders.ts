import { err, ok } from "neverthrow";
import { transferTokensAction } from "@radixdlt/actions"
import { TransferTokensActionInput } from "packages/actions/src/_types"
import { Decoder } from "@radixdlt/data-formats"
import { isArray } from "@radixdlt/util"
import { ActionType } from "./_types"
import { UInt256 } from '@radixdlt/uint256'

export const actionDecoder: Decoder = (value, key) => 
    key === 'actions' && isArray(value)
    ? ok(value.map(
        // TODO add type guard / validation and use TransferTokensActionInput instead of any
        (action: any) =>
            action.type === ActionType.TOKEN_TRANSFER
            ? ok(transferTokensAction(action as TransferTokensActionInput))
            : err(Error('Decoding an action failed. Unknown action type.'))
    ))
    : undefined

export const tokenFeeDecoder: Decoder = (value, key) => 
    key === 'fee' && typeof value === 'number'
    ? ok(new UInt256(value))
    : undefined
