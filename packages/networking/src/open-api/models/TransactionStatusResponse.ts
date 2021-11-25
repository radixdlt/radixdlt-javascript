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
    AccountTransaction,
    AccountTransactionFromJSON,
    AccountTransactionFromJSONTyped,
    AccountTransactionToJSON,
    LedgerState,
    LedgerStateFromJSON,
    LedgerStateFromJSONTyped,
    LedgerStateToJSON,
} from './';

/**
 * 
 * @export
 * @interface TransactionStatusResponse
 */
export interface TransactionStatusResponse {
    /**
     * 
     * @type {LedgerState}
     * @memberof TransactionStatusResponse
     */
    ledgerState: LedgerState;
    /**
     * 
     * @type {Array<AccountTransaction>}
     * @memberof TransactionStatusResponse
     */
    transaction: Array<AccountTransaction>;
}

export function TransactionStatusResponseFromJSON(json: any): TransactionStatusResponse {
    return TransactionStatusResponseFromJSONTyped(json, false);
}

export function TransactionStatusResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): TransactionStatusResponse {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'ledgerState': LedgerStateFromJSON(json['ledger_state']),
        'transaction': ((json['transaction'] as Array<any>).map(AccountTransactionFromJSON)),
    };
}

export function TransactionStatusResponseToJSON(value?: TransactionStatusResponse | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'ledger_state': LedgerStateToJSON(value.ledgerState),
        'transaction': ((value.transaction as Array<any>).map(AccountTransactionToJSON)),
    };
}

