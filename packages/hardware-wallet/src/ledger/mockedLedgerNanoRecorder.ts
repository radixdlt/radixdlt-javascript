import {
	LedgerRequest,
	LedgerResponse,
	MockedLedgerNanoRecorderT,
	RequestAndResponse,
} from './_types'

const create = (): MockedLedgerNanoRecorderT => {
	let requests: LedgerRequest[] = []
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

	return {
		recorded: rNr,
		lastRnR,
		lastRequest: () => lastRnR().apdu,
		lastResponse: () => lastRnR().response,
		recordRequest,
		recordResponse,
	}
}

export const MockedLedgerNanoRecorder = {
	create,
}
