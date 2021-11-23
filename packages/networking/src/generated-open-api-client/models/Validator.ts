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
    ValidatorInfo,
    ValidatorInfoFromJSON,
    ValidatorInfoFromJSONTyped,
    ValidatorInfoToJSON,
    ValidatorProperties,
    ValidatorPropertiesFromJSON,
    ValidatorPropertiesFromJSONTyped,
    ValidatorPropertiesToJSON,
} from './';

/**
 * 
 * @export
 * @interface Validator
 */
export interface Validator {
    /**
     * 
     * @type {string}
     * @memberof Validator
     */
    validatorAddress: string;
    /**
     * 
     * @type {TokenAmount}
     * @memberof Validator
     */
    stake: TokenAmount;
    /**
     * 
     * @type {ValidatorInfo}
     * @memberof Validator
     */
    info: ValidatorInfo;
    /**
     * 
     * @type {ValidatorProperties}
     * @memberof Validator
     */
    properties: ValidatorProperties;
}

export function ValidatorFromJSON(json: any): Validator {
    return ValidatorFromJSONTyped(json, false);
}

export function ValidatorFromJSONTyped(json: any, ignoreDiscriminator: boolean): Validator {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'validatorAddress': json['validator_address'],
        'stake': TokenAmountFromJSON(json['stake']),
        'info': ValidatorInfoFromJSON(json['info']),
        'properties': ValidatorPropertiesFromJSON(json['properties']),
    };
}

export function ValidatorToJSON(value?: Validator | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'validator_address': value.validatorAddress,
        'stake': TokenAmountToJSON(value.stake),
        'info': ValidatorInfoToJSON(value.info),
        'properties': ValidatorPropertiesToJSON(value.properties),
    };
}

