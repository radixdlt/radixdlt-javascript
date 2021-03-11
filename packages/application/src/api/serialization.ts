import { Address } from "@radixdlt/account"
import { Decoder, JSONDecoding } from "@radixdlt/data-formats"
import { Amount } from "@radixdlt/primitives"
import { ok } from "neverthrow"
import { BurnTokensAction } from "packages/actions/src/burnTokensAction"
import { TransferTokensAction } from "packages/actions/src/transferTokensAction"
import { Atom } from "packages/atom/src/atom"
import { AtomIdentifier } from "packages/atom/src/atomIdentifier"
import { FixedSupplyTokenDefinitionParticle } from "packages/atom/src/particles/fixedSupplyTokenDefinitionParticle"
import { MutableSupplyTokenDefinitionParticle } from "packages/atom/src/particles/mutableSupplyTokenDefinitionParticle"
import { SpunParticle } from "packages/atom/src/particles/spunParticle"
import { TransferrableTokensParticle } from "packages/atom/src/particles/transferrableTokensParticle"
import { UnallocatedTokensParticle } from "packages/atom/src/particles/unallocatedTokensParticle"
import { ResourceIdentifier } from "packages/atom/src/resourceIdentifier"
import { TokenFee } from "../tokenFee"

export const RadixJSONDecoding = <T>() => JSONDecoding
    .withDecoders(
        Address.JSONDecoder,
        Amount.JSONDecoder,
        TransferrableTokensParticle.JSONDecoder,
        UnallocatedTokensParticle.JSONDecoder,
        FixedSupplyTokenDefinitionParticle.JSONDecoder,
        MutableSupplyTokenDefinitionParticle.JSONDecoder,
        Atom.JSONDecoder,
        BurnTokensAction.JSONDecoder,
        TransferTokensAction.JSONDecoder,
        ResourceIdentifier.JSONDecoder,
        SpunParticle.JSONDecoder,
        TokenFee.JSONDecoder,
        AtomIdentifier.JSONDecoder
    )
    .create<T>().fromJSON