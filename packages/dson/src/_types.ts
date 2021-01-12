export type CBOREncodable = {
	toCBOR: (outputMode: DSONOutput) => Buffer
}

export type CBORDecodable = {
	fromCBOR: () => never
}

export type CBORCodable = CBORDecodable & CBOREncodable

export enum DSONOutput {
	Hash,
	API,
}

export type DSONCodable = DSONDecodable & DSONEncodable

export type DSONEncodable = {
	toDSON: (outputMode: DSONOutput) => Buffer
}

export type DSONDecodable = {
	serializer: string
}
