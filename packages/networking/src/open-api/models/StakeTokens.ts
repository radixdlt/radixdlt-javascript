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
    ValidatorIdentifier,
    ValidatorIdentifierFromJSON,
    ValidatorIdentifierFromJSONTyped,
    ValidatorIdentifierToJSON,
} from './';

/**
 * 
 * @export
 * @interface StakeTokens
 */
export interface StakeTokens extends Action {
    /**
     * 
     * @type {AccountIdentifier}
     * @memberof StakeTokens
     */
    from?: AccountIdentifier;
    /**
     * 
     * @type {ValidatorIdentifier}
     * @memberof StakeTokens
     */
    to?: ValidatorIdentifier;
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
        'from': !exists(json, 'from') ? undefined : AccountIdentifierFromJSON(json['from']),
        'to': !exists(json, 'to') ? undefined : ValidatorIdentifierFromJSON(json['to']),
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
        'from': AccountIdentifierToJSON(value.from),
        'to': ValidatorIdentifierToJSON(value.to),
        'amount': TokenAmountToJSON(value.amount),
    };
}

