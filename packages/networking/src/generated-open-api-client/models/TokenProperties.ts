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
 * @interface TokenProperties
 */
export interface TokenProperties {
    /**
     * 
     * @type {string}
     * @memberof TokenProperties
     */
    name?: string;
    /**
     * 
     * @type {string}
     * @memberof TokenProperties
     */
    description?: string;
    /**
     * 
     * @type {string}
     * @memberof TokenProperties
     */
    iconUrl?: string;
    /**
     * 
     * @type {string}
     * @memberof TokenProperties
     */
    url?: string;
    /**
     * 
     * @type {string}
     * @memberof TokenProperties
     */
    symbol: string;
    /**
     * 
     * @type {boolean}
     * @memberof TokenProperties
     */
    isSupplyMutable: boolean;
    /**
     * 
     * @type {string}
     * @memberof TokenProperties
     */
    granularity: string;
    /**
     * 
     * @type {string}
     * @memberof TokenProperties
     */
    owner?: string;
}

export function TokenPropertiesFromJSON(json: any): TokenProperties {
    return TokenPropertiesFromJSONTyped(json, false);
}

export function TokenPropertiesFromJSONTyped(json: any, ignoreDiscriminator: boolean): TokenProperties {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'name': !exists(json, 'name') ? undefined : json['name'],
        'description': !exists(json, 'description') ? undefined : json['description'],
        'iconUrl': !exists(json, 'icon_url') ? undefined : json['icon_url'],
        'url': !exists(json, 'url') ? undefined : json['url'],
        'symbol': json['symbol'],
        'isSupplyMutable': json['is_supply_mutable'],
        'granularity': json['granularity'],
        'owner': !exists(json, 'owner') ? undefined : json['owner'],
    };
}

export function TokenPropertiesToJSON(value?: TokenProperties | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'name': value.name,
        'description': value.description,
        'icon_url': value.iconUrl,
        'url': value.url,
        'symbol': value.symbol,
        'is_supply_mutable': value.isSupplyMutable,
        'granularity': value.granularity,
        'owner': value.owner,
    };
}

