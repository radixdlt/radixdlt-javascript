import { err, Result } from "neverthrow"
import { isObject, isResult } from "./typeGuards"

export const flattenResultsObject = (json: Result<unknown, Error | Error[]>): Result<unknown, Error[]> => {
    let errors: (Error | Error[])[] = [] 

    const flattened = json.map(
        value => {
            if(!isObject(value)) return value
            for(const item in value) {
                const objValue = value[item]

                if(objValue && isResult(objValue)) {
                    const res = flattenResultsObject(objValue)
                    if(res.isErr()) {
                        errors.push(res.error)
                    } else {
                        value[item] = res.value
                    }
                }
            }
            return value
        }
    ).mapErr(err => {
        errors.push(err)
        return errors.flat()
    })
      
    return errors.length > 0 ? err(errors.flat()) : flattened
}