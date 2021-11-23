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
 * @interface AccountTransactionsResponse
 */
export interface AccountTransactionsResponse {
    /**
     * 
     * @type {LedgerState}
     * @memberof AccountTransactionsResponse
     */
    ledgerState: LedgerState;
    /**
     * 
     * @type {number}
     * @memberof AccountTransactionsResponse
     */
    totalCount: number;
    /**
     * 
     * @type {string}
     * @memberof AccountTransactionsResponse
     */
    nextCursor?: string;
    /**
     * 
     * @type {Array<AccountTransaction>}
     * @memberof AccountTransactionsResponse
     */
    transactions: Array<AccountTransaction>;
}

export function AccountTransactionsResponseFromJSON(json: any): AccountTransactionsResponse {
    return AccountTransactionsResponseFromJSONTyped(json, false);
}

export function AccountTransactionsResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): AccountTransactionsResponse {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'ledgerState': LedgerStateFromJSON(json['ledger_state']),
        'totalCount': json['total_count'],
        'nextCursor': !exists(json, 'next_cursor') ? undefined : json['next_cursor'],
        'transactions': ((json['transactions'] as Array<any>).map(AccountTransactionFromJSON)),
    };
}

export function AccountTransactionsResponseToJSON(value?: AccountTransactionsResponse | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'ledger_state': LedgerStateToJSON(value.ledgerState),
        'total_count': value.totalCount,
        'next_cursor': value.nextCursor,
        'transactions': ((value.transactions as Array<any>).map(AccountTransactionToJSON)),
    };
}

