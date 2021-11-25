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
    TransactionRules,
    TransactionRulesFromJSON,
    TransactionRulesFromJSONTyped,
    TransactionRulesToJSON,
} from './';

/**
 * 
 * @export
 * @interface TransactionRulesResponse
 */
export interface TransactionRulesResponse {
    /**
     * 
     * @type {LedgerState}
     * @memberof TransactionRulesResponse
     */
    ledgerState: LedgerState;
    /**
     * 
     * @type {TransactionRules}
     * @memberof TransactionRulesResponse
     */
    transactionRules: TransactionRules;
}

export function TransactionRulesResponseFromJSON(json: any): TransactionRulesResponse {
    return TransactionRulesResponseFromJSONTyped(json, false);
}

export function TransactionRulesResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): TransactionRulesResponse {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'ledgerState': LedgerStateFromJSON(json['ledger_state']),
        'transactionRules': TransactionRulesFromJSON(json['transaction_rules']),
    };
}

export function TransactionRulesResponseToJSON(value?: TransactionRulesResponse | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'ledger_state': LedgerStateToJSON(value.ledgerState),
        'transaction_rules': TransactionRulesToJSON(value.transactionRules),
    };
}

