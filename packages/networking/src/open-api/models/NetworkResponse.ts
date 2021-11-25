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
    LedgerState,
    LedgerStateFromJSON,
    LedgerStateFromJSONTyped,
    LedgerStateToJSON,
} from './';

/**
 * 
 * @export
 * @interface NetworkResponse
 */
export interface NetworkResponse {
    /**
     * 
     * @type {string}
     * @memberof NetworkResponse
     */
    network: string;
    /**
     * 
     * @type {LedgerState}
     * @memberof NetworkResponse
     */
    ledgerState: LedgerState;
}

export function NetworkResponseFromJSON(json: any): NetworkResponse {
    return NetworkResponseFromJSONTyped(json, false);
}

export function NetworkResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): NetworkResponse {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'network': json['network'],
        'ledgerState': LedgerStateFromJSON(json['ledger_state']),
    };
}

export function NetworkResponseToJSON(value?: NetworkResponse | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'network': value.network,
        'ledger_state': LedgerStateToJSON(value.ledgerState),
    };
}
