import __js_importDER from '../indutnyEllipticImportDER'
import BN from 'bn.js'

type ImportedDEROrNull = undefined | { r: BN; s: BN }
declare const importDER: (
	buffer: Buffer,
	encoding?: string,
) => ImportedDEROrNull = __js_importDER
