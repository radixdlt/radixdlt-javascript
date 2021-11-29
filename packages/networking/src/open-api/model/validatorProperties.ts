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

export class ValidatorProperties {
    'url': string;
    'validatorFee': string;
    'name': string;
    'registered': boolean;
    'ownerAccountIdentifier': AccountIdentifier;
    'externalStakeAccepted': boolean;

    static discriminator: string | undefined = undefined;

    static attributeTypeMap: Array<{name: string, baseName: string, type: string}> = [
        {
            "name": "url",
            "baseName": "url",
            "type": "string"
        },
        {
            "name": "validatorFee",
            "baseName": "validator_fee",
            "type": "string"
        },
        {
            "name": "name",
            "baseName": "name",
            "type": "string"
        },
        {
            "name": "registered",
            "baseName": "registered",
            "type": "boolean"
        },
        {
            "name": "ownerAccountIdentifier",
            "baseName": "owner_account_identifier",
            "type": "AccountIdentifier"
        },
        {
            "name": "externalStakeAccepted",
            "baseName": "external_stake_accepted",
            "type": "boolean"
        }    ];

    static getAttributeTypeMap() {
        return ValidatorProperties.attributeTypeMap;
    }
}

