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
    TransactionBuild,
    TransactionBuildFromJSON,
    TransactionBuildFromJSONTyped,
    TransactionBuildToJSON,
} from './';

/**
 * 
 * @export
 * @interface TransactionBuildResponseSuccessAllOf
 */
export interface TransactionBuildResponseSuccessAllOf {
    /**
     * 
     * @type {TransactionBuild}
     * @memberof TransactionBuildResponseSuccessAllOf
     */
    transactionBuild: TransactionBuild;
}

export function TransactionBuildResponseSuccessAllOfFromJSON(json: any): TransactionBuildResponseSuccessAllOf {
    return TransactionBuildResponseSuccessAllOfFromJSONTyped(json, false);
}

export function TransactionBuildResponseSuccessAllOfFromJSONTyped(json: any, ignoreDiscriminator: boolean): TransactionBuildResponseSuccessAllOf {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'transactionBuild': TransactionBuildFromJSON(json['transaction_build']),
    };
}

export function TransactionBuildResponseSuccessAllOfToJSON(value?: TransactionBuildResponseSuccessAllOf | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'transaction_build': TransactionBuildToJSON(value.transactionBuild),
    };
}
