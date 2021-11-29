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
import { Action } from './action';
import { TokenAmount } from './tokenAmount';
import { TransferTokensAllOf } from './transferTokensAllOf';

export class TransferTokens extends Action {
    'from': AccountIdentifier;
    'to': AccountIdentifier;
    'amount': TokenAmount;

    static discriminator: string | undefined = undefined;

    static attributeTypeMap: Array<{name: string, baseName: string, type: string}> = [
        {
            "name": "from",
            "baseName": "from",
            "type": "AccountIdentifier"
        },
        {
            "name": "to",
            "baseName": "to",
            "type": "AccountIdentifier"
        },
        {
            "name": "amount",
            "baseName": "amount",
            "type": "TokenAmount"
        }    ];

    static getAttributeTypeMap() {
        return super.getAttributeTypeMap().concat(TransferTokens.attributeTypeMap);
    }
}

