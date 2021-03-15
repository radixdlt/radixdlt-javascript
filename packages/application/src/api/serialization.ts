import { Address } from "@radixdlt/account"
import { decoder, JSONDecoding } from "@radixdlt/data-formats"
import { Amount } from "@radixdlt/primitives"
import { BurnTokensAction, TransferTokensAction } from "@radixdlt/actions"
import { ResourceIdentifier, TransferrableTokensParticle, UnallocatedTokensParticle, FixedSupplyTokenDefinitionParticle, MutableSupplyTokenDefinitionParticle, Atom, SpunParticle, AtomIdentifier } from "@radixdlt/atom"
import { TokenFee } from "../tokenFee"
import { UInt256 } from '@radixdlt/uint256'
import { ok } from "neverthrow"


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
        AtomIdentifier.JSONDecoder,
    )
    .create<T>().fromJSON