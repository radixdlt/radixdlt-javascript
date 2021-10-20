import { combine } from "neverthrow";
import { AccountAddress, AccountAddressT, ResourceIdentifier, ResourceIdentifierT, ValidatorAddress, ValidatorAddressT } from "packages/account/src/addresses";
import { Amount } from "packages/primitives/src/amount";
import { AmountT } from "packages/primitives/src/_types";

export const Actions = {
  transfer: (input: { from: string, to: string, amount: number, tokenRRI: string }) =>
    combine([
      AccountAddress.fromUnsafe(input.from),
      AccountAddress.fromUnsafe(input.to),
      Amount.fromUnsafe(input.amount),
      ResourceIdentifier.fromUnsafe(input.tokenRRI),
    ]).map(
      (results) => ({
        from: results[0] as AccountAddressT,
        to: results[1] as AccountAddressT,
        amount: results[2] as AmountT,
        rri: results[3] as ResourceIdentifierT,
        type: 'Transfer',
      })
    ),

  stake: (input: {
    validator: string,
    amount: number,
    from: string,
  }) =>
    combine([
      ValidatorAddress.fromUnsafe(input.validator),
      Amount.fromUnsafe(input.amount),
      AccountAddress.fromUnsafe(input.from)
    ]).map(
      (results) => ({
          validator: results[0] as ValidatorAddressT,
          amount: results[1] as AmountT,
          from: results[2] as AccountAddressT,
          type: 'Stake',
      })
    )
}



