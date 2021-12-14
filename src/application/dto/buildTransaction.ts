import { err, Result, ok } from 'neverthrow'
import { AccountAddressT } from '@account'
import { Message } from '@crypto'
import { pipe } from 'ramda'
import { firstValueFrom } from 'rxjs'
import { AccountT } from '../_types'
import {
	ActionType,
	ExecutedAction,
	IntendedAction,
	stakeTokensAction,
	transferTokensAction,
	unstakeTokensAction,
} from '../actions'
import { ExecutedTransaction } from '.'

type Message = {
	plaintext: string
	encrypt: boolean
}

export const buildTransaction =
	(...actions: IntendedAction[]) =>
	(sender: AccountT, message?: Message) =>
		pipe(
			() => checkNumberOfRecipients(actions),
			(
				recipientResult: Result<
					[IntendedAction[], AccountAddressT],
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

export const createTransfer = transferTokensAction.create

export const createStake = stakeTokensAction.create

export const createUnstake = unstakeTokensAction.create

export const checkNumberOfRecipients = (
	actions: IntendedAction[],
): Result<[IntendedAction[], AccountAddressT], Error[]> => {
	const recipients = getRecipients(actions)

	return recipients.length > 1
		? err([
				Error(
					'Found more than one recipient in transaction. This is not supported.',
				),
		  ])
		: ok([actions, recipients[0]])
}

export const getRecipients = (actions: (IntendedAction | ExecutedAction)[]) =>
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
		actions: (IntendedAction | ExecutedAction)[]
		includeFrom?: boolean
		includeTo?: boolean
	}>,
): AccountAddressT[] => {
	const { actions, includeFrom, includeTo } = input
	const flatMapped = actions.reduce((acc: AccountAddressT[], action) => {
		const uniqueAddressOfAction = getUniqueAddresses({
			action,
			includeFrom,
			includeTo,
		})
		return acc.concat(...uniqueAddressOfAction)
	}, [] as AccountAddressT[])
	const set = new Set<string>()
	return flatMapped.filter(a => {
		const str = a.toString()
		const hasNt = !set.has(str)
		set.add(str)
		return hasNt
	})
}

export const getUniqueAddresses = (input: {
	action: IntendedAction | ExecutedAction
	includeFrom?: boolean
	includeTo?: boolean
}): AccountAddressT[] => {
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
