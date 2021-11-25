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
     InternalServerErrorFromJSONTyped,
     InvalidJsonErrorFromJSONTyped,
     InvalidRequestErrorFromJSONTyped
} from './';

/**
 * 
 * @export
 * @interface UnexpectedError
 */
export interface UnexpectedError {
    /**
     * 
     * @type {string}
     * @memberof UnexpectedError
     */
    message: string;
}

export function UnexpectedErrorFromJSON(json: any): UnexpectedError {
    return UnexpectedErrorFromJSONTyped(json, false);
}

export function UnexpectedErrorFromJSONTyped(json: any, ignoreDiscriminator: boolean): UnexpectedError {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    if (!ignoreDiscriminator) {
        if (json['message'] === 'INTERNAL_SERVER_ERROR') {
            return InternalServerErrorFromJSONTyped(json, true);
        }
        if (json['message'] === 'INVALID_JSON') {
            return InvalidJsonErrorFromJSONTyped(json, true);
        }
        if (json['message'] === 'INVALID_REQUEST') {
            return InvalidRequestErrorFromJSONTyped(json, true);
        }
    }
    return {
        
        'message': json['message'],
    };
}

export function UnexpectedErrorToJSON(value?: UnexpectedError | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'message': value.message,
    };
}
