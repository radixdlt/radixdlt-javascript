import { randomNonce } from "@radixdlt/primitives";

const withNonce = (o: object) => ({
    ...o,
    nonce: randomNonce()
})

