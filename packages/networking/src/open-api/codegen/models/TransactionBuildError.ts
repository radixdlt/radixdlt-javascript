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
	BelowMinimumStakeErrorFromJSONTyped,
	CouldNotConstructFeesErrorFromJSONTyped,
	MessageTooLongErrorFromJSONTyped,
	NotEnoughResourcesErrorFromJSONTyped,
	NotValidatorOwnerErrorFromJSONTyped,
} from '.'

/**
 *
 * @export
 * @interface TransactionBuildError
 */
export interface TransactionBuildError {
	/**
	 *
	 * @type {string}
	 * @memberof TransactionBuildError
	 */
	type: string
}

export function TransactionBuildErrorFromJSON(
	json: any,
): TransactionBuildError {
	return TransactionBuildErrorFromJSONTyped(json, false)
}

export function TransactionBuildErrorFromJSONTyped(
	json: any,
	ignoreDiscriminator: boolean,
): TransactionBuildError {
	if (json === undefined || json === null) {
		return json
	}
	if (!ignoreDiscriminator) {
		if (json['type'] === 'BelowMinimumStakeError') {
			return BelowMinimumStakeErrorFromJSONTyped(json, true)
		}
		if (json['type'] === 'CouldNotConstructFeesError') {
			return CouldNotConstructFeesErrorFromJSONTyped(json, true)
		}
		if (json['type'] === 'MessageTooLongError') {
			return MessageTooLongErrorFromJSONTyped(json, true)
		}
		if (json['type'] === 'NotEnoughResourcesError') {
			return NotEnoughResourcesErrorFromJSONTyped(json, true)
		}
		if (json['type'] === 'NotValidatorOwnerError') {
			return NotValidatorOwnerErrorFromJSONTyped(json, true)
		}
	}
	return {
		type: json['type'],
	}
}

export function TransactionBuildErrorToJSON(
	value?: TransactionBuildError | null,
): any {
	if (value === undefined) {
		return undefined
	}
	if (value === null) {
		return null
	}
	return {
		type: value.type,
	}
}
