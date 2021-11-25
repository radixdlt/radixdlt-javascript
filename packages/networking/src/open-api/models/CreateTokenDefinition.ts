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
    CreateTokenDefinitionAllOf,
    CreateTokenDefinitionAllOfFromJSON,
    CreateTokenDefinitionAllOfFromJSONTyped,
    CreateTokenDefinitionAllOfToJSON,
    TokenAmount,
    TokenAmountFromJSON,
    TokenAmountFromJSONTyped,
    TokenAmountToJSON,
    TokenProperties,
    TokenPropertiesFromJSON,
    TokenPropertiesFromJSONTyped,
    TokenPropertiesToJSON,
} from './';

/**
 * 
 * @export
 * @interface CreateTokenDefinition
 */
export interface CreateTokenDefinition extends Action {
    /**
     * 
     * @type {TokenProperties}
     * @memberof CreateTokenDefinition
     */
    tokenProperties: TokenProperties;
    /**
     * 
     * @type {TokenAmount}
     * @memberof CreateTokenDefinition
     */
    tokenSupply: TokenAmount;
    /**
     * 
     * @type {AccountIdentifier}
     * @memberof CreateTokenDefinition
     */
    to?: AccountIdentifier;
}

export function CreateTokenDefinitionFromJSON(json: any): CreateTokenDefinition {
    return CreateTokenDefinitionFromJSONTyped(json, false);
}

export function CreateTokenDefinitionFromJSONTyped(json: any, ignoreDiscriminator: boolean): CreateTokenDefinition {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        ...ActionFromJSONTyped(json, ignoreDiscriminator),
        'tokenProperties': TokenPropertiesFromJSON(json['token_properties']),
        'tokenSupply': TokenAmountFromJSON(json['token_supply']),
        'to': !exists(json, 'to') ? undefined : AccountIdentifierFromJSON(json['to']),
    };
}

export function CreateTokenDefinitionToJSON(value?: CreateTokenDefinition | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        ...ActionToJSON(value),
        'token_properties': TokenPropertiesToJSON(value.tokenProperties),
        'token_supply': TokenAmountToJSON(value.tokenSupply),
        'to': AccountIdentifierToJSON(value.to),
    };
}

