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
    TokenAmount,
    TokenAmountFromJSON,
    TokenAmountFromJSONTyped,
    TokenAmountToJSON,
    UnstakeTokensAllOf,
    UnstakeTokensAllOfFromJSON,
    UnstakeTokensAllOfFromJSONTyped,
    UnstakeTokensAllOfToJSON,
    ValidatorIdentifier,
    ValidatorIdentifierFromJSON,
    ValidatorIdentifierFromJSONTyped,
    ValidatorIdentifierToJSON,
} from './';

/**
 * 
 * @export
 * @interface UnstakeTokens
 */
export interface UnstakeTokens extends Action {
    /**
     * 
     * @type {ValidatorIdentifier}
     * @memberof UnstakeTokens
     */
    from: ValidatorIdentifier;
    /**
     * 
     * @type {AccountIdentifier}
     * @memberof UnstakeTokens
     */
    to: AccountIdentifier;
    /**
     * 
     * @type {TokenAmount}
     * @memberof UnstakeTokens
     */
    amount: TokenAmount;
}

export function UnstakeTokensFromJSON(json: any): UnstakeTokens {
    return UnstakeTokensFromJSONTyped(json, false);
}

export function UnstakeTokensFromJSONTyped(json: any, ignoreDiscriminator: boolean): UnstakeTokens {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        ...ActionFromJSONTyped(json, ignoreDiscriminator),
        'from': ValidatorIdentifierFromJSON(json['from']),
        'to': AccountIdentifierFromJSON(json['to']),
        'amount': TokenAmountFromJSON(json['amount']),
    };
}

export function UnstakeTokensToJSON(value?: UnstakeTokens | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        ...ActionToJSON(value),
        'from': ValidatorIdentifierToJSON(value.from),
        'to': AccountIdentifierToJSON(value.to),
        'amount': TokenAmountToJSON(value.amount),
    };
}
