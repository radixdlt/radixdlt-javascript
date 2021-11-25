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
 * @interface StakeTokensAllOf
 */
export interface StakeTokensAllOf {
    /**
     * 
     * @type {AccountIdentifier}
     * @memberof StakeTokensAllOf
     */
    from?: AccountIdentifier;
    /**
     * 
     * @type {ValidatorIdentifier}
     * @memberof StakeTokensAllOf
     */
    to?: ValidatorIdentifier;
    /**
     * 
     * @type {TokenAmount}
     * @memberof StakeTokensAllOf
     */
    amount?: TokenAmount;
}

export function StakeTokensAllOfFromJSON(json: any): StakeTokensAllOf {
    return StakeTokensAllOfFromJSONTyped(json, false);
}

export function StakeTokensAllOfFromJSONTyped(json: any, ignoreDiscriminator: boolean): StakeTokensAllOf {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'from': !exists(json, 'from') ? undefined : AccountIdentifierFromJSON(json['from']),
        'to': !exists(json, 'to') ? undefined : ValidatorIdentifierFromJSON(json['to']),
        'amount': !exists(json, 'amount') ? undefined : TokenAmountFromJSON(json['amount']),
    };
}

export function StakeTokensAllOfToJSON(value?: StakeTokensAllOf | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'from': AccountIdentifierToJSON(value.from),
        'to': ValidatorIdentifierToJSON(value.to),
        'amount': TokenAmountToJSON(value.amount),
    };
}
