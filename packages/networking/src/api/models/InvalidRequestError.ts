/* tslint:disable */
/* eslint-disable */
/**
 * Wallet/Explorer API
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 2.0.0
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
 * @interface InvalidRequestError
 */
export interface InvalidRequestError {
    /**
     * 
     * @type {string}
     * @memberof InvalidRequestError
     */
    pointer?: string;
    /**
     * 
     * @type {string}
     * @memberof InvalidRequestError
     */
    cause?: string;
}

export function InvalidRequestErrorFromJSON(json: any): InvalidRequestError {
    return InvalidRequestErrorFromJSONTyped(json, false);
}

export function InvalidRequestErrorFromJSONTyped(json: any, ignoreDiscriminator: boolean): InvalidRequestError {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'pointer': !exists(json, 'pointer') ? undefined : json['pointer'],
        'cause': !exists(json, 'cause') ? undefined : json['cause'],
    };
}

export function InvalidRequestErrorToJSON(value?: InvalidRequestError | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'pointer': value.pointer,
        'cause': value.cause,
    };
}

