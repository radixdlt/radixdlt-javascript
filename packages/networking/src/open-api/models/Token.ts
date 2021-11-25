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
    TokenAmount,
    TokenAmountFromJSON,
    TokenAmountFromJSONTyped,
    TokenAmountToJSON,
    TokenIdentifier,
    TokenIdentifierFromJSON,
    TokenIdentifierFromJSONTyped,
    TokenIdentifierToJSON,
    TokenInfo,
    TokenInfoFromJSON,
    TokenInfoFromJSONTyped,
    TokenInfoToJSON,
    TokenProperties,
    TokenPropertiesFromJSON,
    TokenPropertiesFromJSONTyped,
    TokenPropertiesToJSON,
} from './';

/**
 * 
 * @export
 * @interface Token
 */
export interface Token {
    /**
     * 
     * @type {TokenIdentifier}
     * @memberof Token
     */
    tokenIdentifier: TokenIdentifier;
    /**
     * 
     * @type {TokenAmount}
     * @memberof Token
     */
    tokenSupply: TokenAmount;
    /**
     * 
     * @type {TokenInfo}
     * @memberof Token
     */
    info: TokenInfo;
    /**
     * 
     * @type {TokenProperties}
     * @memberof Token
     */
    tokenProperties: TokenProperties;
}

export function TokenFromJSON(json: any): Token {
    return TokenFromJSONTyped(json, false);
}

export function TokenFromJSONTyped(json: any, ignoreDiscriminator: boolean): Token {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'tokenIdentifier': TokenIdentifierFromJSON(json['token_identifier']),
        'tokenSupply': TokenAmountFromJSON(json['token_supply']),
        'info': TokenInfoFromJSON(json['info']),
        'tokenProperties': TokenPropertiesFromJSON(json['token_properties']),
    };
}

export function TokenToJSON(value?: Token | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'token_identifier': TokenIdentifierToJSON(value.tokenIdentifier),
        'token_supply': TokenAmountToJSON(value.tokenSupply),
        'info': TokenInfoToJSON(value.info),
        'token_properties': TokenPropertiesToJSON(value.tokenProperties),
    };
}
