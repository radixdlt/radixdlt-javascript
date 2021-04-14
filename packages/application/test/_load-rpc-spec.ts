// A little hacky solution so that we can load the RPC spec asynchronously 
// and generate tests from it, since 'describe()' callback 
// isn't allowed to be async in Jest. 💩💩💩
// https://github.com/facebook/jest/issues/2235

import RPC_SPEC = require('../src/api/json-rpc/open-rpc-spec.json')
import { parseOpenRPCDocument } from '@open-rpc/schema-utils-js'

const loadRPCSpec = async () => {
    // @ts-ignore
    process['rpcSpec'] = await parseOpenRPCDocument(RPC_SPEC as any)
}

export default loadRPCSpec