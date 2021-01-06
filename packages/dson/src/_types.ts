export enum DSONOutput {
    Hash,
    API
}

export type DSONCodable = DSONDecodable & DSONEncodable

export type DSONEncodable = {
    toDSON: (outputMode: DSONOutput) => Buffer
}

export type DSONDecodable = {}