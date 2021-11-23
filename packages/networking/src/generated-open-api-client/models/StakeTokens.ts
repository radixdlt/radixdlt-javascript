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
    Action,
    ActionFromJSON,
    ActionFromJSONTyped,
    ActionToJSON,
    StakeTokensAllOf,
    StakeTokensAllOfFromJSON,
    StakeTokensAllOfFromJSONTyped,
    StakeTokensAllOfToJSON,
    TokenAmount,
    TokenAmountFromJSON,
    TokenAmountFromJSONTyped,
    TokenAmountToJSON,
} from './';

/**
 * 
 * @export
 * @interface StakeTokens
 */
export interface StakeTokens extends Action {
    /**
     * 
     * @type {string}
     * @memberof StakeTokens
     */
    from?: string;
    /**
     * 
     * @type {string}
     * @memberof StakeTokens
     */
    to?: string;
    /**
     * 
     * @type {TokenAmount}
     * @memberof StakeTokens
     */
    amount?: TokenAmount;
}

export function StakeTokensFromJSON(json: any): StakeTokens {
    return StakeTokensFromJSONTyped(json, false);
}

export function StakeTokensFromJSONTyped(json: any, ignoreDiscriminator: boolean): StakeTokens {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        ...ActionFromJSONTyped(json, ignoreDiscriminator),
        'from': !exists(json, 'from') ? undefined : json['from'],
        'to': !exists(json, 'to') ? undefined : json['to'],
        'amount': !exists(json, 'amount') ? undefined : TokenAmountFromJSON(json['amount']),
    };
}

export function StakeTokensToJSON(value?: StakeTokens | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        ...ActionToJSON(value),
        'from': value.from,
        'to': value.to,
        'amount': TokenAmountToJSON(value.amount),
    };
}

