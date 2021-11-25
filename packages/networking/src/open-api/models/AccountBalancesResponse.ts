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
    AccountBalances,
    AccountBalancesFromJSON,
    AccountBalancesFromJSONTyped,
    AccountBalancesToJSON,
    LedgerState,
    LedgerStateFromJSON,
    LedgerStateFromJSONTyped,
    LedgerStateToJSON,
} from './';

/**
 * 
 * @export
 * @interface AccountBalancesResponse
 */
export interface AccountBalancesResponse {
    /**
     * 
     * @type {LedgerState}
     * @memberof AccountBalancesResponse
     */
    ledgerState: LedgerState;
    /**
     * 
     * @type {AccountBalances}
     * @memberof AccountBalancesResponse
     */
    accountBalances: AccountBalances;
}

export function AccountBalancesResponseFromJSON(json: any): AccountBalancesResponse {
    return AccountBalancesResponseFromJSONTyped(json, false);
}

export function AccountBalancesResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): AccountBalancesResponse {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'ledgerState': LedgerStateFromJSON(json['ledger_state']),
        'accountBalances': AccountBalancesFromJSON(json['account_balances']),
    };
}

export function AccountBalancesResponseToJSON(value?: AccountBalancesResponse | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'ledger_state': LedgerStateToJSON(value.ledgerState),
        'account_balances': AccountBalancesToJSON(value.accountBalances),
    };
}
