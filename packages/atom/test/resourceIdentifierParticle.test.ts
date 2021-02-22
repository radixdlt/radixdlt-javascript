import { OutputMode } from '@radixdlt/data-formats'
import {
	isResourceIdentifierParticle,
	ResourceIdentifierParticle,
} from '../src/particles/resourceIdentifierParticle'
import { ResourceIdentifier } from '../src/resourceIdentifier'

describe('ResourceIdentifierParticle', () => {
	const rri = ResourceIdentifier.fromString(
		'/9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT/FOOBAR',
	)._unsafeUnwrap()

	it('should be able to created it from an resource identifier', () => {
		const rriParticle = ResourceIdentifierParticle.create(rri)
		expect(rriParticle.alwaysZeroNonce.value.equals(0)).toBe(true)
		expect(rriParticle.resourceIdentifier.name).toBe('FOOBAR')
		expect(isResourceIdentifierParticle(rriParticle)).toBe(true)
	})

	it('should be able to dson encode', () => {
		const rriParticle = ResourceIdentifierParticle.create(rri)
		const expected =
			'bf656e6f6e63650063727269583d062f3953386b684c485a6136467379476f36333478516f3951774c67534847705848485737363444356d50594263726e665a563652542f464f4f4241526a73657269616c697a65727372616469782e7061727469636c65732e727269ff'

		const dson = rriParticle.toDSON(OutputMode.ALL)._unsafeUnwrap()
		expect(dson.toString('hex')).toBe(expected)
	})

	it('should be able to JSON encode', () => {
		const rriParticle = ResourceIdentifierParticle.create(rri)
		const expected = {
			serializer: ResourceIdentifierParticle.SERIALIZER,
			nonce: rriParticle.alwaysZeroNonce.toJSON()._unsafeUnwrap(),
			rri: rriParticle.resourceIdentifier.toJSON()._unsafeUnwrap(),
		}
		const json = rriParticle.toJSON()._unsafeUnwrap()

		expect(JSON.stringify(json)).toEqual(JSON.stringify(expected))
	})
})
