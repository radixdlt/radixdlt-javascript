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
 * @interface AccountTransactionsRequest
 */
export interface AccountTransactionsRequest {
    /**
     * 
     * @type {string}
     * @memberof AccountTransactionsRequest
     */
    network: string;
    /**
     * 
     * @type {AccountIdentifier}
     * @memberof AccountTransactionsRequest
     */
    accountIdentifier: AccountIdentifier;
    /**
     * 
     * @type {string}
     * @memberof AccountTransactionsRequest
     */
    cursor?: string;
    /**
     * 
     * @type {number}
     * @memberof AccountTransactionsRequest
     */
    limit?: number;
}

export function AccountTransactionsRequestFromJSON(json: any): AccountTransactionsRequest {
    return AccountTransactionsRequestFromJSONTyped(json, false);
}

export function AccountTransactionsRequestFromJSONTyped(json: any, ignoreDiscriminator: boolean): AccountTransactionsRequest {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'network': json['network'],
        'accountIdentifier': AccountIdentifierFromJSON(json['account_identifier']),
        'cursor': !exists(json, 'cursor') ? undefined : json['cursor'],
        'limit': !exists(json, 'limit') ? undefined : json['limit'],
    };
}

export function AccountTransactionsRequestToJSON(value?: AccountTransactionsRequest | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'network': value.network,
        'account_identifier': AccountIdentifierToJSON(value.accountIdentifier),
        'cursor': value.cursor,
        'limit': value.limit,
    };
}
