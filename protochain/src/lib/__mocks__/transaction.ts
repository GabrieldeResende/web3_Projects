import TransactionType from "../transactionType";
import sha256 from 'crypto-js/sha256'
import Validation from "../validation";
import TransactionInput from "./transactionInput";
import TransactionOutput from "./transactionOutput";

/**
 * Mocked Transaction class
 */

export default class Transaction {
    type: TransactionType
    timestamp: number
    hash: string
    txInputs: TransactionInput[] | undefined
    txOutputs: TransactionOutput[]

    constructor(tx?: Transaction) {
        this.type = tx?.type || TransactionType.REGULAR
        this.timestamp = tx?.timestamp || Date.now()
        this.txOutputs = tx?.txOutputs || [new TransactionOutput()]
        this.txInputs = tx?.txInputs || [new TransactionInput()]
        this.hash = tx?.hash || this.getHash()

        
    }

    getHash(): string {
        return "abc";
    }

    isValid() : Validation {
        if(this.timestamp < 1 || !this.hash) return new Validation(false, "invalid mock transaction")


        return new Validation()
    }
}