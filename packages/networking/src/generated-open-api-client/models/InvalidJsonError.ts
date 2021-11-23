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
 * @interface InvalidJsonError
 */
export interface InvalidJsonError {
    /**
     * 
     * @type {string}
     * @memberof InvalidJsonError
     */
    cause?: string;
}

export function InvalidJsonErrorFromJSON(json: any): InvalidJsonError {
    return InvalidJsonErrorFromJSONTyped(json, false);
}

export function InvalidJsonErrorFromJSONTyped(json: any, ignoreDiscriminator: boolean): InvalidJsonError {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'cause': !exists(json, 'cause') ? undefined : json['cause'],
    };
}

export function InvalidJsonErrorToJSON(value?: InvalidJsonError | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'cause': value.cause,
    };
}

