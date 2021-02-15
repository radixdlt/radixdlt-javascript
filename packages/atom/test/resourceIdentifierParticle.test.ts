import { fromJSONDefault, OutputMode } from '@radixdlt/data-formats'
import { resourceIdentifierFromString } from '../src/resourceIdentifier'
import {
	isResourceIdentifierParticle,
	resourceIdentifierParticle,
	RRIParticleJSONDecoder,
	RRI_SERIALIZER,
} from '../src/particles/resourceIdentifierParticle'

describe('ResourceIdentifierParticle', () => {
	const rri = resourceIdentifierFromString(
		'/9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT/FOOBAR',
	)._unsafeUnwrap()

	it('should be able to created it from an resource identifier', () => {
		const rriParticle = resourceIdentifierParticle(rri)
		expect(rriParticle.alwaysZeroNonce.value.equals(0)).toBe(true)
		expect(rriParticle.resourceIdentifier.name).toBe('FOOBAR')
		expect(isResourceIdentifierParticle(rriParticle)).toBe(true)
	})

	it('should be able to dson encode', () => {
		const rriParticle = resourceIdentifierParticle(rri)
		const expected =
			'bf656e6f6e63650063727269583d062f3953386b684c485a6136467379476f36333478516f3951774c67534847705848485737363444356d50594263726e665a563652542f464f4f4241526a73657269616c697a65727372616469782e7061727469636c65732e727269ff'

		const dson = rriParticle.toDSON(OutputMode.ALL)._unsafeUnwrap()
		expect(dson.toString('hex')).toBe(expected)
	})

	it('should be able to JSON encode', () => {
		const rriParticle = resourceIdentifierParticle(rri)
		const expected = {
			serializer: RRI_SERIALIZER,
			nonce: rriParticle.alwaysZeroNonce.toJSON(),
			rri: rriParticle.resourceIdentifier.toJSON(),
		}
		const json = rriParticle.toJSON()

		expect(JSON.stringify(json)).toEqual(JSON.stringify(expected))
	})
})
