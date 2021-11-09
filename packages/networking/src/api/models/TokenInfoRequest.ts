/* tslint:disable */
/* eslint-disable */
/**
 * Wallet/Explorer API
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 2.0.0
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
 * @interface TokenInfoRequest
 */
export interface TokenInfoRequest {
    /**
     * 
     * @type {string}
     * @memberof TokenInfoRequest
     */
    rri?: string;
}

export function TokenInfoRequestFromJSON(json: any): TokenInfoRequest {
    return TokenInfoRequestFromJSONTyped(json, false);
}

export function TokenInfoRequestFromJSONTyped(json: any, ignoreDiscriminator: boolean): TokenInfoRequest {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'rri': !exists(json, 'rri') ? undefined : json['rri'],
    };
}

export function TokenInfoRequestToJSON(value?: TokenInfoRequest | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'rri': value.rri,
    };
}

