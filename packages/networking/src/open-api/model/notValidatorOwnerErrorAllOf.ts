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

import { RequestFile } from './models';
import { AccountIdentifier } from './accountIdentifier';

export class NotValidatorOwnerErrorAllOf {
    'owner': AccountIdentifier;
    'user': AccountIdentifier;

    static discriminator: string | undefined = undefined;

    static attributeTypeMap: Array<{name: string, baseName: string, type: string}> = [
        {
            "name": "owner",
            "baseName": "owner",
            "type": "AccountIdentifier"
        },
        {
            "name": "user",
            "baseName": "user",
            "type": "AccountIdentifier"
        }    ];

    static getAttributeTypeMap() {
        return NotValidatorOwnerErrorAllOf.attributeTypeMap;
    }
}

