import { transformMessage } from '../api/open-api/responseHandlers'

/* eslint-disable */
describe('transformMessage', () => {
	it.each([
		['00006b656b', 'kek'],
		[
			'01ff02b4b098bcbf29997fc26e8377ef70a39077178e34a0bf67c8540ee6e69aff36627245c6e3a88e23b2796ec2d045906c30cf23092e38e118dfdd51cfb265db5c',
			'01ff02b4b098bcbf29997fc26e8377ef70a39077178e34a0bf67c8540ee6e69aff36627245c6e3a88e23b2796ec2d045906c30cf23092e38e118dfdd51cfb265db5c',
		],
		['303030303734363537333734', 'test'],
		['303030303638363932303734363537333734363936653637', 'hi testing'],
		[
			'303030303431366536663734363836313230366636653635323837343635373337343239',
			'Anotha one(test)',
		],
		[null, undefined],
		['312132123312', '<Failed to interpret message>'],
	])('transforms "%s" into "%s"', (input, expected) => {
		// @ts-ignore
		expect(transformMessage(input)).toBe(expected)
	})
})
