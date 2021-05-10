import {
	EmulatedLedgerIO,
	LedgerRequest,
	LedgerResponse,
	MockedLedgerNanoRecorderT,
	RequestAndResponse,
	UserOutputAndInput,
} from './_types'
import { BehaviorSubject, Subject, Subscription } from 'rxjs'
import { LedgerButtonPress, PromptUserForInput } from './wrapped/emulatedLedger'

const create = (
	input?: Readonly<{ io: EmulatedLedgerIO }>,
): MockedLedgerNanoRecorderT => {
	const subs = new Subscription()
	const io = input?.io ?? {
		usersInputOnLedger: new Subject<LedgerButtonPress>(),
		promptUserForInputOnLedger: new Subject<PromptUserForInput>(),
	}

	const requests: LedgerRequest[] = []
	const rNr: RequestAndResponse[] = []

	const lastRnR = (): RequestAndResponse => {
		return rNr[rNr.length - 1]
	}

	const recordRequest = (request: LedgerRequest): void => {
		requests.push(request)
	}
	const recordResponse = (response: LedgerResponse): RequestAndResponse => {
		const requestIndex = requests.findIndex((r) => r.uuid === response.uuid)
		if (requestIndex === -1) {
			throw new Error(
				`Found no request matching UUID of response: ${response.uuid}`,
			)
		}
		const request = requests[requestIndex]
		const rr: RequestAndResponse = {
			apdu: request.apdu,
			response,
		}
		rNr.push(rr)
		// Remove from requests
		requests.splice(requestIndex, 1)
		return rr
	}

	const userIO: UserOutputAndInput[] = []
	const lastUserInputSubject = new BehaviorSubject<LedgerButtonPress>(
		<LedgerButtonPress>{},
	)
	const promptUserForInputSubject = new BehaviorSubject<PromptUserForInput>(
		<PromptUserForInput>{},
	)
	const lastUserInput = (): LedgerButtonPress => {
		return lastUserInputSubject.getValue()
	}
	const lastPromptToUser = (): PromptUserForInput => {
		return promptUserForInputSubject.getValue()
	}

	subs.add(
		io.usersInputOnLedger.subscribe((fromUser) => {
			const lastPrompt = lastPromptToUser()
			const newUserIO: UserOutputAndInput = {
				toUser: lastPrompt,
				fromUser,
			}
			userIO.push(newUserIO)
			lastUserInputSubject.next(fromUser)
		}),
	)

	subs.add(
		io.promptUserForInputOnLedger.subscribe((p) => {
			promptUserForInputSubject.next(p)
		}),
	)

	return {
		...io,
		recorded: rNr,
		lastRnR,
		lastRequest: () => lastRnR().apdu,
		lastResponse: () => lastRnR().response,
		recordRequest,
		recordResponse,
		lastUserInput,
		lastPromptToUser,
		userIO,
	}
}

export const MockedLedgerNanoRecorder = {
	create,
}
