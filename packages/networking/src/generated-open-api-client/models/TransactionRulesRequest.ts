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
/**
 * 
 * @export
 * @interface TransactionRulesRequest
 */
export interface TransactionRulesRequest {
    /**
     * 
     * @type {string}
     * @memberof TransactionRulesRequest
     */
    network: string;
}

export function TransactionRulesRequestFromJSON(json: any): TransactionRulesRequest {
    return TransactionRulesRequestFromJSONTyped(json, false);
}

export function TransactionRulesRequestFromJSONTyped(json: any, ignoreDiscriminator: boolean): TransactionRulesRequest {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'network': json['network'],
    };
}

export function TransactionRulesRequestToJSON(value?: TransactionRulesRequest | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'network': value.network,
    };
}

