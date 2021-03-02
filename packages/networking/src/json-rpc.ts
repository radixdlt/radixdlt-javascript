import { RequestManager, Client, HTTPTransport } from "@open-rpc/client-js"
import { getAPI } from "./api-interface"
import { Endpoint } from "./_types"

export const RPCClient = (url: URL) => {
  const transport = new HTTPTransport(url.toString())
  const requestManager = new RequestManager([transport])
  const client = new Client(requestManager)

  const call = (endpoint: Endpoint, ...params: unknown[]): Promise<any> =>
    client.request({ method: endpoint, params: params[0] as any })

  const handleResponse = (response: unknown): unknown => response

  return getAPI(call, handleResponse)
}


