import * as ecc from "tiny-secp256k1"
import ECPairFactory from "ecpair"
import  sha256  from "crypto-js/sha256"
import Validation from "./validation"

const ECPair = ECPairFactory(ecc)

/**
 * TransactionInput class
 */
export default class TransactionInput {
    fromAddress: string
    amount: number
    signature: string
    previousTx: string

    /**
     * Creates a new TransactionInput
     * @param txInput The tx input data
     */
    constructor(txInput?: TransactionInput) {
        this.previousTx = txInput?.previousTx || ""
        this.fromAddress = txInput?.fromAddress || ""
        this.amount = txInput?.amount || 0
        this.signature = txInput?.signature || ""
    }

    /**
     * Generates the tx input signature
     * @param privateKey the "from" private key
     */
    sign(privateKey: string) : void {
        this.signature = ECPair.fromPrivateKey(Buffer.from(privateKey, "hex")).sign(Buffer.from(this.getHash(), "hex")).toString("hex")
    }

    /**
     * Generates the tx input hash
     * @returns The tx input hash
     */
    getHash() : string {
        return sha256(this.previousTx + this.fromAddress + this.amount).toString()
    }

    /**
     * Validates if the tx input is ok
     * @returns Returns a validation result object
     */
    isValid(): Validation {
        if(!this.previousTx || !this.signature) return new Validation(false, "Signature and previoustx are required")
        if(this.amount < 1) return new Validation(false, "Amount must be greater than zero")

        const hash = Buffer.from(this.getHash(), "hex") 
        const isValid = ECPair.fromPublicKey(Buffer.from(this.fromAddress, "hex")).verify(hash, Buffer.from(this.signature, "hex"))

        return isValid ? new Validation() : new Validation(false, "Invalid tx input signature")
    }
}