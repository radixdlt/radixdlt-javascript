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

import { exists, mapValues } from '../runtime'
import {
	Action,
	ActionFromJSON,
	ActionFromJSONTyped,
	ActionToJSON,
	MintTokensAllOf,
	MintTokensAllOfFromJSON,
	MintTokensAllOfFromJSONTyped,
	MintTokensAllOfToJSON,
	TokenAmount,
	TokenAmountFromJSON,
	TokenAmountFromJSONTyped,
	TokenAmountToJSON,
	ValidatorIdentifier,
	ValidatorIdentifierFromJSON,
	ValidatorIdentifierFromJSONTyped,
	ValidatorIdentifierToJSON,
} from '.'

/**
 *
 * @export
 * @interface MintTokens
 */
export interface MintTokens extends Action {
	/**
	 *
	 * @type {ValidatorIdentifier}
	 * @memberof MintTokens
	 */
	to: ValidatorIdentifier
	/**
	 *
	 * @type {TokenAmount}
	 * @memberof MintTokens
	 */
	amount: TokenAmount
}

export function MintTokensFromJSON(json: any): MintTokens {
	return MintTokensFromJSONTyped(json, false)
}

export function MintTokensFromJSONTyped(
	json: any,
	ignoreDiscriminator: boolean,
): MintTokens {
	if (json === undefined || json === null) {
		return json
	}
	return {
		...ActionFromJSONTyped(json, ignoreDiscriminator),
		to: ValidatorIdentifierFromJSON(json['to']),
		amount: TokenAmountFromJSON(json['amount']),
	}
}

export function MintTokensToJSON(value?: MintTokens | null): any {
	if (value === undefined) {
		return undefined
	}
	if (value === null) {
		return null
	}
	return {
		...ActionToJSON(value),
		to: ValidatorIdentifierToJSON(value.to),
		amount: TokenAmountToJSON(value.amount),
	}
}
