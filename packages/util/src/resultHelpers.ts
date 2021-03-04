import { err, Result } from "neverthrow"
import { isObject, isResult } from "./typeGuards"
import { mapObjIndexed } from 'ramda'

export const flattenNestedResults = (json: Result<unknown, Error | Error[]>): Result<unknown, Error[]> => {
    let errors: (Error | Error[])[] = [] 

    const flattened = json.map(
        value => 
            isObject(value)
            ? mapObjIndexed(
                objValue => 
                    isResult(objValue)
                    ? flattenNestedResults(objValue)
                    : objValue,
                value)
            : value
    ).mapErr(err => {
        errors.push(err)
        return errors.flat()
    })
      
    return errors.length > 0 ? err(errors.flat()) : flattened
}