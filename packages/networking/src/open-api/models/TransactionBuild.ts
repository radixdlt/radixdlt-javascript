/* tslint:disable */
/* eslint-disable */
/**
 * Radix Gateway API
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 0.9.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime';
import {
    TokenAmount,
    TokenAmountFromJSON,
    TokenAmountFromJSONTyped,
    TokenAmountToJSON,
} from './';

/**
 * 
 * @export
 * @interface TransactionBuild
 */
export interface TransactionBuild {
    /**
     * 
     * @type {TokenAmount}
     * @memberof TransactionBuild
     */
    fee: TokenAmount;
    /**
     * 
     * @type {string}
     * @memberof TransactionBuild
     */
    unsignedTransaction: string;
    /**
     * 
     * @type {string}
     * @memberof TransactionBuild
     */
    payloadToSign: string;
}

export function TransactionBuildFromJSON(json: any): TransactionBuild {
    return TransactionBuildFromJSONTyped(json, false);
}

export function TransactionBuildFromJSONTyped(json: any, ignoreDiscriminator: boolean): TransactionBuild {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'fee': TokenAmountFromJSON(json['fee']),
        'unsignedTransaction': json['unsigned_transaction'],
        'payloadToSign': json['payload_to_sign'],
    };
}

export function TransactionBuildToJSON(value?: TransactionBuild | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'fee': TokenAmountToJSON(value.fee),
        'unsigned_transaction': value.unsignedTransaction,
        'payload_to_sign': value.payloadToSign,
    };
}
