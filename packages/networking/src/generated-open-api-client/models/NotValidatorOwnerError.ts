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
    NotValidatorOwnerErrorAllOf,
    NotValidatorOwnerErrorAllOfFromJSON,
    NotValidatorOwnerErrorAllOfFromJSONTyped,
    NotValidatorOwnerErrorAllOfToJSON,
    TransactionBuildResult,
    TransactionBuildResultFromJSON,
    TransactionBuildResultFromJSONTyped,
    TransactionBuildResultToJSON,
} from './';

/**
 * 
 * @export
 * @interface NotValidatorOwnerError
 */
export interface NotValidatorOwnerError extends TransactionBuildResult {
    /**
     * 
     * @type {string}
     * @memberof NotValidatorOwnerError
     */
    owner: string;
    /**
     * 
     * @type {string}
     * @memberof NotValidatorOwnerError
     */
    user: string;
}

export function NotValidatorOwnerErrorFromJSON(json: any): NotValidatorOwnerError {
    return NotValidatorOwnerErrorFromJSONTyped(json, false);
}

export function NotValidatorOwnerErrorFromJSONTyped(json: any, ignoreDiscriminator: boolean): NotValidatorOwnerError {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        ...TransactionBuildResultFromJSONTyped(json, ignoreDiscriminator),
        'owner': json['owner'],
        'user': json['user'],
    };
}

export function NotValidatorOwnerErrorToJSON(value?: NotValidatorOwnerError | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        ...TransactionBuildResultToJSON(value),
        'owner': value.owner,
        'user': value.user,
    };
}

