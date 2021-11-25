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
 * @interface CouldNotConstructFeesErrorAllOf
 */
export interface CouldNotConstructFeesErrorAllOf {
    /**
     * 
     * @type {number}
     * @memberof CouldNotConstructFeesErrorAllOf
     */
    attempts: number;
}

export function CouldNotConstructFeesErrorAllOfFromJSON(json: any): CouldNotConstructFeesErrorAllOf {
    return CouldNotConstructFeesErrorAllOfFromJSONTyped(json, false);
}

export function CouldNotConstructFeesErrorAllOfFromJSONTyped(json: any, ignoreDiscriminator: boolean): CouldNotConstructFeesErrorAllOf {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'attempts': json['attempts'],
    };
}

export function CouldNotConstructFeesErrorAllOfToJSON(value?: CouldNotConstructFeesErrorAllOf | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'attempts': value.attempts,
    };
}
