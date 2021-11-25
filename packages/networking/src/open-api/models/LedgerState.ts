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
 * @interface LedgerState
 */
export interface LedgerState {
    /**
     * 
     * @type {number}
     * @memberof LedgerState
     */
    version: number;
    /**
     * 
     * @type {string}
     * @memberof LedgerState
     */
    timestamp: string;
    /**
     * 
     * @type {number}
     * @memberof LedgerState
     */
    epoch: number;
    /**
     * 
     * @type {number}
     * @memberof LedgerState
     */
    round: number;
}

export function LedgerStateFromJSON(json: any): LedgerState {
    return LedgerStateFromJSONTyped(json, false);
}

export function LedgerStateFromJSONTyped(json: any, ignoreDiscriminator: boolean): LedgerState {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'version': json['version'],
        'timestamp': json['timestamp'],
        'epoch': json['epoch'],
        'round': json['round'],
    };
}

export function LedgerStateToJSON(value?: LedgerState | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'version': value.version,
        'timestamp': value.timestamp,
        'epoch': value.epoch,
        'round': value.round,
    };
}
