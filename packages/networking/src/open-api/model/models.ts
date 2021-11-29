import localVarRequest from 'request';

export * from './accountBalances';
export * from './accountBalancesRequest';
export * from './accountBalancesResponse';
export * from './accountIdentifier';
export * from './accountStakeEntry';
export * from './accountStakesRequest';
export * from './accountStakesResponse';
export * from './accountTransaction';
export * from './accountTransactionMetadata';
export * from './accountTransactionStatus';
export * from './accountTransactionsRequest';
export * from './accountTransactionsResponse';
export * from './accountUnstakeEntry';
export * from './accountUnstakesRequest';
export * from './accountUnstakesResponse';
export * from './action';
export * from './belowMinimumStakeError';
export * from './belowMinimumStakeErrorAllOf';
export * from './burnTokens';
export * from './burnTokensAllOf';
export * from './couldNotConstructFeesError';
export * from './couldNotConstructFeesErrorAllOf';
export * from './createTokenDefinition';
export * from './createTokenDefinitionAllOf';
export * from './epochRange';
export * from './internalServerError';
export * from './invalidJsonError';
export * from './invalidRequestError';
export * from './ledgerState';
export * from './messageTooLongError';
export * from './messageTooLongErrorAllOf';
export * from './mintTokens';
export * from './mintTokensAllOf';
export * from './networkResponse';
export * from './notEnoughResourcesError';
export * from './notEnoughResourcesErrorAllOf';
export * from './notValidatorOwnerError';
export * from './notValidatorOwnerErrorAllOf';
export * from './stakeTokens';
export * from './stakeTokensAllOf';
export * from './token';
export * from './tokenAmount';
export * from './tokenDeriveRequest';
export * from './tokenDeriveResponse';
export * from './tokenIdentifier';
export * from './tokenInfo';
export * from './tokenNativeRequest';
export * from './tokenNativeResponse';
export * from './tokenProperties';
export * from './tokenRequest';
export * from './tokenResponse';
export * from './transactionBuild';
export * from './transactionBuildError';
export * from './transactionBuildRequest';
export * from './transactionBuildResponse';
export * from './transactionBuildResponseError';
export * from './transactionBuildResponseErrorAllOf';
export * from './transactionBuildResponseSuccess';
export * from './transactionBuildResponseSuccessAllOf';
export * from './transactionFinalizeRequest';
export * from './transactionFinalizeRequestSignature';
export * from './transactionFinalizeResponse';
export * from './transactionIdentifier';
export * from './transactionRules';
export * from './transactionRulesRequest';
export * from './transactionRulesResponse';
export * from './transactionStatusRequest';
export * from './transactionStatusResponse';
export * from './transactionSubmitRequest';
export * from './transactionSubmitResponse';
export * from './transferTokens';
export * from './transferTokensAllOf';
export * from './unexpectedError';
export * from './unstakeTokens';
export * from './unstakeTokensAllOf';
export * from './validator';
export * from './validatorIdentifier';
export * from './validatorInfo';
export * from './validatorInfoRequest';
export * from './validatorInfoResponse';
export * from './validatorProperties';
export * from './validatorUptime';
export * from './validatorsRequest';
export * from './validatorsResponse';

import * as fs from 'fs';

export interface RequestDetailedFile {
    value: Buffer;
    options?: {
        filename?: string;
        contentType?: string;
    }
}

export type RequestFile = string | Buffer | fs.ReadStream | RequestDetailedFile;


import { AccountBalances } from './accountBalances';
import { AccountBalancesRequest } from './accountBalancesRequest';
import { AccountBalancesResponse } from './accountBalancesResponse';
import { AccountIdentifier } from './accountIdentifier';
import { AccountStakeEntry } from './accountStakeEntry';
import { AccountStakesRequest } from './accountStakesRequest';
import { AccountStakesResponse } from './accountStakesResponse';
import { AccountTransaction } from './accountTransaction';
import { AccountTransactionMetadata } from './accountTransactionMetadata';
import { AccountTransactionStatus } from './accountTransactionStatus';
import { AccountTransactionsRequest } from './accountTransactionsRequest';
import { AccountTransactionsResponse } from './accountTransactionsResponse';
import { AccountUnstakeEntry } from './accountUnstakeEntry';
import { AccountUnstakesRequest } from './accountUnstakesRequest';
import { AccountUnstakesResponse } from './accountUnstakesResponse';
import { Action } from './action';
import { BelowMinimumStakeError } from './belowMinimumStakeError';
import { BelowMinimumStakeErrorAllOf } from './belowMinimumStakeErrorAllOf';
import { BurnTokens } from './burnTokens';
import { BurnTokensAllOf } from './burnTokensAllOf';
import { CouldNotConstructFeesError } from './couldNotConstructFeesError';
import { CouldNotConstructFeesErrorAllOf } from './couldNotConstructFeesErrorAllOf';
import { CreateTokenDefinition } from './createTokenDefinition';
import { CreateTokenDefinitionAllOf } from './createTokenDefinitionAllOf';
import { EpochRange } from './epochRange';
import { InternalServerError } from './internalServerError';
import { InvalidJsonError } from './invalidJsonError';
import { InvalidRequestError } from './invalidRequestError';
import { LedgerState } from './ledgerState';
import { MessageTooLongError } from './messageTooLongError';
import { MessageTooLongErrorAllOf } from './messageTooLongErrorAllOf';
import { MintTokens } from './mintTokens';
import { MintTokensAllOf } from './mintTokensAllOf';
import { NetworkResponse } from './networkResponse';
import { NotEnoughResourcesError } from './notEnoughResourcesError';
import { NotEnoughResourcesErrorAllOf } from './notEnoughResourcesErrorAllOf';
import { NotValidatorOwnerError } from './notValidatorOwnerError';
import { NotValidatorOwnerErrorAllOf } from './notValidatorOwnerErrorAllOf';
import { StakeTokens } from './stakeTokens';
import { StakeTokensAllOf } from './stakeTokensAllOf';
import { Token } from './token';
import { TokenAmount } from './tokenAmount';
import { TokenDeriveRequest } from './tokenDeriveRequest';
import { TokenDeriveResponse } from './tokenDeriveResponse';
import { TokenIdentifier } from './tokenIdentifier';
import { TokenInfo } from './tokenInfo';
import { TokenNativeRequest } from './tokenNativeRequest';
import { TokenNativeResponse } from './tokenNativeResponse';
import { TokenProperties } from './tokenProperties';
import { TokenRequest } from './tokenRequest';
import { TokenResponse } from './tokenResponse';
import { TransactionBuild } from './transactionBuild';
import { TransactionBuildError } from './transactionBuildError';
import { TransactionBuildRequest } from './transactionBuildRequest';
import { TransactionBuildResponse } from './transactionBuildResponse';
import { TransactionBuildResponseError } from './transactionBuildResponseError';
import { TransactionBuildResponseErrorAllOf } from './transactionBuildResponseErrorAllOf';
import { TransactionBuildResponseSuccess } from './transactionBuildResponseSuccess';
import { TransactionBuildResponseSuccessAllOf } from './transactionBuildResponseSuccessAllOf';
import { TransactionFinalizeRequest } from './transactionFinalizeRequest';
import { TransactionFinalizeRequestSignature } from './transactionFinalizeRequestSignature';
import { TransactionFinalizeResponse } from './transactionFinalizeResponse';
import { TransactionIdentifier } from './transactionIdentifier';
import { TransactionRules } from './transactionRules';
import { TransactionRulesRequest } from './transactionRulesRequest';
import { TransactionRulesResponse } from './transactionRulesResponse';
import { TransactionStatusRequest } from './transactionStatusRequest';
import { TransactionStatusResponse } from './transactionStatusResponse';
import { TransactionSubmitRequest } from './transactionSubmitRequest';
import { TransactionSubmitResponse } from './transactionSubmitResponse';
import { TransferTokens } from './transferTokens';
import { TransferTokensAllOf } from './transferTokensAllOf';
import { UnexpectedError } from './unexpectedError';
import { UnstakeTokens } from './unstakeTokens';
import { UnstakeTokensAllOf } from './unstakeTokensAllOf';
import { Validator } from './validator';
import { ValidatorIdentifier } from './validatorIdentifier';
import { ValidatorInfo } from './validatorInfo';
import { ValidatorInfoRequest } from './validatorInfoRequest';
import { ValidatorInfoResponse } from './validatorInfoResponse';
import { ValidatorProperties } from './validatorProperties';
import { ValidatorUptime } from './validatorUptime';
import { ValidatorsRequest } from './validatorsRequest';
import { ValidatorsResponse } from './validatorsResponse';

/* tslint:disable:no-unused-variable */
let primitives = [
                    "string",
                    "boolean",
                    "double",
                    "integer",
                    "long",
                    "float",
                    "number",
                    "any"
                 ];

let enumsMap: {[index: string]: any} = {
        "AccountTransactionStatus.StatusEnum": AccountTransactionStatus.StatusEnum,
}

let typeMap: {[index: string]: any} = {
    "AccountBalances": AccountBalances,
    "AccountBalancesRequest": AccountBalancesRequest,
    "AccountBalancesResponse": AccountBalancesResponse,
    "AccountIdentifier": AccountIdentifier,
    "AccountStakeEntry": AccountStakeEntry,
    "AccountStakesRequest": AccountStakesRequest,
    "AccountStakesResponse": AccountStakesResponse,
    "AccountTransaction": AccountTransaction,
    "AccountTransactionMetadata": AccountTransactionMetadata,
    "AccountTransactionStatus": AccountTransactionStatus,
    "AccountTransactionsRequest": AccountTransactionsRequest,
    "AccountTransactionsResponse": AccountTransactionsResponse,
    "AccountUnstakeEntry": AccountUnstakeEntry,
    "AccountUnstakesRequest": AccountUnstakesRequest,
    "AccountUnstakesResponse": AccountUnstakesResponse,
    "Action": Action,
    "BelowMinimumStakeError": BelowMinimumStakeError,
    "BelowMinimumStakeErrorAllOf": BelowMinimumStakeErrorAllOf,
    "BurnTokens": BurnTokens,
    "BurnTokensAllOf": BurnTokensAllOf,
    "CouldNotConstructFeesError": CouldNotConstructFeesError,
    "CouldNotConstructFeesErrorAllOf": CouldNotConstructFeesErrorAllOf,
    "CreateTokenDefinition": CreateTokenDefinition,
    "CreateTokenDefinitionAllOf": CreateTokenDefinitionAllOf,
    "EpochRange": EpochRange,
    "InternalServerError": InternalServerError,
    "InvalidJsonError": InvalidJsonError,
    "InvalidRequestError": InvalidRequestError,
    "LedgerState": LedgerState,
    "MessageTooLongError": MessageTooLongError,
    "MessageTooLongErrorAllOf": MessageTooLongErrorAllOf,
    "MintTokens": MintTokens,
    "MintTokensAllOf": MintTokensAllOf,
    "NetworkResponse": NetworkResponse,
    "NotEnoughResourcesError": NotEnoughResourcesError,
    "NotEnoughResourcesErrorAllOf": NotEnoughResourcesErrorAllOf,
    "NotValidatorOwnerError": NotValidatorOwnerError,
    "NotValidatorOwnerErrorAllOf": NotValidatorOwnerErrorAllOf,
    "StakeTokens": StakeTokens,
    "StakeTokensAllOf": StakeTokensAllOf,
    "Token": Token,
    "TokenAmount": TokenAmount,
    "TokenDeriveRequest": TokenDeriveRequest,
    "TokenDeriveResponse": TokenDeriveResponse,
    "TokenIdentifier": TokenIdentifier,
    "TokenInfo": TokenInfo,
    "TokenNativeRequest": TokenNativeRequest,
    "TokenNativeResponse": TokenNativeResponse,
    "TokenProperties": TokenProperties,
    "TokenRequest": TokenRequest,
    "TokenResponse": TokenResponse,
    "TransactionBuild": TransactionBuild,
    "TransactionBuildError": TransactionBuildError,
    "TransactionBuildRequest": TransactionBuildRequest,
    "TransactionBuildResponse": TransactionBuildResponse,
    "TransactionBuildResponseError": TransactionBuildResponseError,
    "TransactionBuildResponseErrorAllOf": TransactionBuildResponseErrorAllOf,
    "TransactionBuildResponseSuccess": TransactionBuildResponseSuccess,
    "TransactionBuildResponseSuccessAllOf": TransactionBuildResponseSuccessAllOf,
    "TransactionFinalizeRequest": TransactionFinalizeRequest,
    "TransactionFinalizeRequestSignature": TransactionFinalizeRequestSignature,
    "TransactionFinalizeResponse": TransactionFinalizeResponse,
    "TransactionIdentifier": TransactionIdentifier,
    "TransactionRules": TransactionRules,
    "TransactionRulesRequest": TransactionRulesRequest,
    "TransactionRulesResponse": TransactionRulesResponse,
    "TransactionStatusRequest": TransactionStatusRequest,
    "TransactionStatusResponse": TransactionStatusResponse,
    "TransactionSubmitRequest": TransactionSubmitRequest,
    "TransactionSubmitResponse": TransactionSubmitResponse,
    "TransferTokens": TransferTokens,
    "TransferTokensAllOf": TransferTokensAllOf,
    "UnexpectedError": UnexpectedError,
    "UnstakeTokens": UnstakeTokens,
    "UnstakeTokensAllOf": UnstakeTokensAllOf,
    "Validator": Validator,
    "ValidatorIdentifier": ValidatorIdentifier,
    "ValidatorInfo": ValidatorInfo,
    "ValidatorInfoRequest": ValidatorInfoRequest,
    "ValidatorInfoResponse": ValidatorInfoResponse,
    "ValidatorProperties": ValidatorProperties,
    "ValidatorUptime": ValidatorUptime,
    "ValidatorsRequest": ValidatorsRequest,
    "ValidatorsResponse": ValidatorsResponse,
}

export class ObjectSerializer {
    public static findCorrectType(data: any, expectedType: string) {
        if (data == undefined) {
            return expectedType;
        } else if (primitives.indexOf(expectedType.toLowerCase()) !== -1) {
            return expectedType;
        } else if (expectedType === "Date") {
            return expectedType;
        } else {
            if (enumsMap[expectedType]) {
                return expectedType;
            }

            if (!typeMap[expectedType]) {
                return expectedType; // w/e we don't know the type
            }

            // Check the discriminator
            let discriminatorProperty = typeMap[expectedType].discriminator;
            if (discriminatorProperty == null) {
                return expectedType; // the type does not have a discriminator. use it.
            } else {
                if (data[discriminatorProperty]) {
                    var discriminatorType = data[discriminatorProperty];
                    if(typeMap[discriminatorType]){
                        return discriminatorType; // use the type given in the discriminator
                    } else {
                        return expectedType; // discriminator did not map to a type
                    }
                } else {
                    return expectedType; // discriminator was not present (or an empty string)
                }
            }
        }
    }

    public static serialize(data: any, type: string) {
        if (data == undefined) {
            return data;
        } else if (primitives.indexOf(type.toLowerCase()) !== -1) {
            return data;
        } else if (type.lastIndexOf("Array<", 0) === 0) { // string.startsWith pre es6
            let subType: string = type.replace("Array<", ""); // Array<Type> => Type>
            subType = subType.substring(0, subType.length - 1); // Type> => Type
            let transformedData: any[] = [];
            for (let index = 0; index < data.length; index++) {
                let datum = data[index];
                transformedData.push(ObjectSerializer.serialize(datum, subType));
            }
            return transformedData;
        } else if (type === "Date") {
            return data.toISOString();
        } else {
            if (enumsMap[type]) {
                return data;
            }
            if (!typeMap[type]) { // in case we dont know the type
                return data;
            }

            // Get the actual type of this object
            type = this.findCorrectType(data, type);

            // get the map for the correct type.
            let attributeTypes = typeMap[type].getAttributeTypeMap();
            let instance: {[index: string]: any} = {};
            for (let index = 0; index < attributeTypes.length; index++) {
                let attributeType = attributeTypes[index];
                instance[attributeType.baseName] = ObjectSerializer.serialize(data[attributeType.name], attributeType.type);
            }
            return instance;
        }
    }

    public static deserialize(data: any, type: string) {
        // polymorphism may change the actual type.
        type = ObjectSerializer.findCorrectType(data, type);
        if (data == undefined) {
            return data;
        } else if (primitives.indexOf(type.toLowerCase()) !== -1) {
            return data;
        } else if (type.lastIndexOf("Array<", 0) === 0) { // string.startsWith pre es6
            let subType: string = type.replace("Array<", ""); // Array<Type> => Type>
            subType = subType.substring(0, subType.length - 1); // Type> => Type
            let transformedData: any[] = [];
            for (let index = 0; index < data.length; index++) {
                let datum = data[index];
                transformedData.push(ObjectSerializer.deserialize(datum, subType));
            }
            return transformedData;
        } else if (type === "Date") {
            return new Date(data);
        } else {
            if (enumsMap[type]) {// is Enum
                return data;
            }

            if (!typeMap[type]) { // dont know the type
                return data;
            }
            let instance = new typeMap[type]();
            let attributeTypes = typeMap[type].getAttributeTypeMap();
            for (let index = 0; index < attributeTypes.length; index++) {
                let attributeType = attributeTypes[index];
                instance[attributeType.name] = ObjectSerializer.deserialize(data[attributeType.baseName], attributeType.type);
            }
            return instance;
        }
    }
}

export interface Authentication {
    /**
    * Apply authentication settings to header and query params.
    */
    applyToRequest(requestOptions: localVarRequest.Options): Promise<void> | void;
}

export class HttpBasicAuth implements Authentication {
    public username: string = '';
    public password: string = '';

    applyToRequest(requestOptions: localVarRequest.Options): void {
        requestOptions.auth = {
            username: this.username, password: this.password
        }
    }
}

export class HttpBearerAuth implements Authentication {
    public accessToken: string | (() => string) = '';

    applyToRequest(requestOptions: localVarRequest.Options): void {
        if (requestOptions && requestOptions.headers) {
            const accessToken = typeof this.accessToken === 'function'
                            ? this.accessToken()
                            : this.accessToken;
            requestOptions.headers["Authorization"] = "Bearer " + accessToken;
        }
    }
}

export class ApiKeyAuth implements Authentication {
    public apiKey: string = '';

    constructor(private location: string, private paramName: string) {
    }

    applyToRequest(requestOptions: localVarRequest.Options): void {
        if (this.location == "query") {
            (<any>requestOptions.qs)[this.paramName] = this.apiKey;
        } else if (this.location == "header" && requestOptions && requestOptions.headers) {
            requestOptions.headers[this.paramName] = this.apiKey;
        } else if (this.location == 'cookie' && requestOptions && requestOptions.headers) {
            if (requestOptions.headers['Cookie']) {
                requestOptions.headers['Cookie'] += '; ' + this.paramName + '=' + encodeURIComponent(this.apiKey);
            }
            else {
                requestOptions.headers['Cookie'] = this.paramName + '=' + encodeURIComponent(this.apiKey);
            }
        }
    }
}

export class OAuth implements Authentication {
    public accessToken: string = '';

    applyToRequest(requestOptions: localVarRequest.Options): void {
        if (requestOptions && requestOptions.headers) {
            requestOptions.headers["Authorization"] = "Bearer " + this.accessToken;
        }
    }
}

export class VoidAuth implements Authentication {
    public username: string = '';
    public password: string = '';

    applyToRequest(_: localVarRequest.Options): void {
        // Do nothing
    }
}

export type Interceptor = (requestOptions: localVarRequest.Options) => (Promise<void> | void);
