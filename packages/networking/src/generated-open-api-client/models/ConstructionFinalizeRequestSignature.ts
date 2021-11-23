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
 * @interface ConstructionFinalizeRequestSignature
 */
export interface ConstructionFinalizeRequestSignature {
    /**
     * 
     * @type {string}
     * @memberof ConstructionFinalizeRequestSignature
     */
    publicKey?: string;
    /**
     * 
     * @type {string}
     * @memberof ConstructionFinalizeRequestSignature
     */
    bytes: string;
}

export function ConstructionFinalizeRequestSignatureFromJSON(json: any): ConstructionFinalizeRequestSignature {
    return ConstructionFinalizeRequestSignatureFromJSONTyped(json, false);
}

export function ConstructionFinalizeRequestSignatureFromJSONTyped(json: any, ignoreDiscriminator: boolean): ConstructionFinalizeRequestSignature {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'publicKey': !exists(json, 'publicKey') ? undefined : json['publicKey'],
        'bytes': json['bytes'],
    };
}

export function ConstructionFinalizeRequestSignatureToJSON(value?: ConstructionFinalizeRequestSignature | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'publicKey': value.publicKey,
        'bytes': value.bytes,
    };
}

