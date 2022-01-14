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
    [
      '303166663032656130303866376531393037643237666465663237376564313439623535323065626539643039336265363765303138663534633136633430666236663939353735383434343566343866346538623535356330393539343137663539356465333032663862633639313764363263623363346538623734386539323834636332316563303632386537303061356664616463663030323135303238373935303639656335653436',
      {
        encrypted: true,
        raw: '01ff02ea008f7e1907d27fdef277ed149b5520ebe9d093be67e018f54c16c40fb6f9957584445f48f4e8b555c0959417f595de302f8bc6917d62cb3c4e8b748e9284cc21ec0628e700a5fdadcf00215028795069ec5e46',
      },
    ],
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
