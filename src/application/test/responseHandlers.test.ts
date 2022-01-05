import { transformMessage } from '../api/open-api/responseHandlers'

describe('transformMessage', () => {
	it.each([
		['00006b656b', { raw: 'kek', encrypted: false }],
		[
			'01ff02b4b098bcbf29997fc26e8377ef70a39077178e34a0bf67c8540ee6e69aff36627245c6e3a88e23b2796ec2d045906c30cf23092e38e118dfdd51cfb265db5c',
			{
				encrypted: true,
				raw: '01ff02b4b098bcbf29997fc26e8377ef70a39077178e34a0bf67c8540ee6e69aff36627245c6e3a88e23b2796ec2d045906c30cf23092e38e118dfdd51cfb265db5c',
			},
		],
		['303030303734363537333734', { raw: 'test', encrypted: false }],
		[
			'303030303638363932303734363537333734363936653637',
			{ encrypted: false, raw: 'hi testing' },
		],
		[
			'303030303431366536663734363836313230366636653635323837343635373337343239',
			{ raw: 'Anotha one(test)', encrypted: false },
		],
		[null, 'Message format invalid.'],
		['312132123312', 'Message format invalid.'],
	])('transforms "%s" into "%s"', (input, expected) => {
		transformMessage(input as string).match(
			value => {
				expect(value).toEqual(expected)
			},
			error => {
				expect(error.message).toEqual(expected)
			},
		)
	})
})
