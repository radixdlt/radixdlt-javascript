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
    AccountIdentifier,
    AccountIdentifierFromJSON,
    AccountIdentifierFromJSONTyped,
    AccountIdentifierToJSON,
} from './';

/**
 * 
 * @export
 * @interface AccountBalancesRequest
 */
export interface AccountBalancesRequest {
    /**
     * 
     * @type {string}
     * @memberof AccountBalancesRequest
     */
    network: string;
    /**
     * 
     * @type {AccountIdentifier}
     * @memberof AccountBalancesRequest
     */
    accountIdentifier: AccountIdentifier;
}

export function AccountBalancesRequestFromJSON(json: any): AccountBalancesRequest {
    return AccountBalancesRequestFromJSONTyped(json, false);
}

export function AccountBalancesRequestFromJSONTyped(json: any, ignoreDiscriminator: boolean): AccountBalancesRequest {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'network': json['network'],
        'accountIdentifier': AccountIdentifierFromJSON(json['account_identifier']),
    };
}

export function AccountBalancesRequestToJSON(value?: AccountBalancesRequest | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'network': value.network,
        'account_identifier': AccountIdentifierToJSON(value.accountIdentifier),
    };
}
