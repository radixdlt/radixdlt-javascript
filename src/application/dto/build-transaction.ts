import { err, Result, combineWithAllErrors, ok } from 'neverthrow'
import { AccountAddressT } from '@account'
import { Message } from '@crypto'
import { pipe } from 'ramda'
import { firstValueFrom } from 'rxjs'
import { AccountT } from '../_types'
import {
	ActionType,
	ActionTypes,
	IntendedStakeTokens,
	IntendedTransferTokens,
	IntendedUnstakeTokens,
} from '../actions'

type Message = {
	plaintext: string
	encrypt: boolean
}

export const buildTransaction =
	(...actions: ActionTypes[]) =>
	(sender: AccountT, message?: Message) =>
		pipe(
			() => checkNumberOfRecipients(actions),
			(
				recipientResult: Result<
					[ActionTypes[], AccountAddressT],
					Error[]
				>,
			) =>
				recipientResult.asyncMap(async ([actions, recipient]) => ({
					actions,
					message: message?.encrypt
						? (
								await firstValueFrom(
									sender.encrypt({
										plaintext: message.plaintext,
										publicKeyOfOtherParty:
											recipient.publicKey,
									}),
								)
						  ).combined()
						: message?.plaintext
						? Message.createPlaintext(message.plaintext).bytes
						: undefined,
				})),
		)().mapErr(err => err.flat())

export const createTransfer = IntendedTransferTokens.create

export const createStake = IntendedStakeTokens.create

export const createUnstake = IntendedUnstakeTokens.create

export const checkNumberOfRecipients = (
	actions: ActionTypes[],
): Result<[ActionTypes[], AccountAddressT], Error[]> => {
	const recipients = getRecipients(actions)

	return recipients.length > 1
		? err([
				Error(
					'Found more than one recipient in transaction. This is not supported.',
				),
		  ])
		: ok([actions, recipients[0]])
}

export const getRecipients = (actions: ActionTypes[]) =>
	actions.reduce(
		(accounts, action) =>
			action.type === ActionType.TRANSFER &&
			!accounts.some(account => account.equals(action.to_account))
				? accounts.concat(accounts, action.to_account)
				: accounts,
		[] as AccountAddressT[],
	)

export const flatMapAddressesOf = (
	input: Readonly<{
		actions: ActionTypes[]
		includeFrom?: boolean
		includeTo?: boolean
	}>,
): AccountAddressT[] => {
	const { actions, includeFrom, includeTo } = input
	const flatMapped = actions.reduce(
		(acc: AccountAddressT[], action: ActionTypes) => {
			const uniqueAddressOfAction = getUniqueAddresses({
				action,
				includeFrom,
				includeTo,
			})
			return acc.concat(...uniqueAddressOfAction)
		},
		[] as AccountAddressT[],
	)
	const set = new Set<string>()
	return flatMapped.filter(a => {
		const str = a.toString()
		const hasNt = !set.has(str)
		set.add(str)
		return hasNt
	})
}

export const getUniqueAddresses = (
	input: Readonly<{
		action: ActionTypes
		includeFrom?: boolean
		includeTo?: boolean
	}>,
): AccountAddressT[] => {
	const action = input.action
	const includeFrom = input.includeFrom ?? true
	const includeTo = input.includeTo ?? true
	if (action.type === ActionType.TRANSFER) {
		const addresses: AccountAddressT[] = []
		if (includeTo) {
			addresses.push(action.to_account)
		}
		if (includeFrom) {
			addresses.push(action.from_account)
		}
		return addresses
	} else if (action.type === ActionType.STAKE) {
		const addresses: AccountAddressT[] = []
		if (includeFrom) {
			addresses.push(action.from_account)
		}
		return addresses
	} else if (action.type === ActionType.UNSTAKE) {
		const addresses: AccountAddressT[] = []
		if (includeFrom) {
			addresses.push(action.to_account)
		}
		return addresses
	} else {
		return []
	}
}
