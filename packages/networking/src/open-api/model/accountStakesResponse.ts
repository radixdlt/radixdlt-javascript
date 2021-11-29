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
import { AccountStakeEntry } from './accountStakeEntry';
import { LedgerState } from './ledgerState';

export class AccountStakesResponse {
    'ledgerState': LedgerState;
    'stakes': Array<AccountStakeEntry>;

    static discriminator: string | undefined = undefined;

    static attributeTypeMap: Array<{name: string, baseName: string, type: string}> = [
        {
            "name": "ledgerState",
            "baseName": "ledger_state",
            "type": "LedgerState"
        },
        {
            "name": "stakes",
            "baseName": "stakes",
            "type": "Array<AccountStakeEntry>"
        }    ];

    static getAttributeTypeMap() {
        return AccountStakesResponse.attributeTypeMap;
    }
}

