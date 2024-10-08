import { describe, test, expect, beforeAll, jest } from '@jest/globals'
import Block from '../src/lib/block'
import BlockInfo from '../src/lib/blockInfo';
import Transaction from '../src/lib/transaction';
import TransactionType from '../src/lib/transactionType';
import TransactionInput from '../src/lib/transactionInput';
import TransactionOutput from '../src/lib/transactionOutput';

jest.mock("../src/lib/transaction")
jest.mock("../src/lib/transactionInput")
jest.mock("../src/lib/transactionOutput")

describe("Block tests", () => {

    const exampleDifficulty = 1;
    const exampleMiner = "Gabriel";
    let genesis: Block;

    beforeAll(() => {
        genesis = new Block({
            transactions: [new Transaction({
                txInputs: [new TransactionInput()]
            } as Transaction)]
        } as Block);
    })

    test('Should be valid', () => {
        const block = new Block({
            index: 1,
            previousHash: genesis.hash,
            transactions: [new Transaction({
                txInputs: [new TransactionInput()]
            } as Transaction)]
        } as Block)

        block.transactions.push(new Transaction({
            type: TransactionType.FEE,
            txOutputs: [new TransactionOutput()]
        } as Transaction))
        block.hash = block.getHash()

        block.mine(exampleDifficulty, exampleMiner)
        const valid = block.isValid(genesis.hash, genesis.index, exampleDifficulty)
        // console.log(valid.message);
        expect(valid.success).toBeTruthy()

    })

    test('Should NOT be valid', () => {
        const block = new Block({
            index: 1,
            previousHash: genesis.hash,
            transactions: [new Transaction({
                txInputs: [new TransactionInput()]
            } as Transaction)]
        } as Block)

        block.transactions.push(new Transaction({
            type: TransactionType.FEE,
            txOutputs: [new TransactionOutput()]
        } as Transaction))
        block.hash = block.getHash()

        block.mine(exampleDifficulty, exampleMiner)
        block.hash = "abc"
        const valid = block.isValid(genesis.hash, genesis.index, exampleDifficulty)
        // console.log(valid.message);
        expect(valid.success).toBeFalsy()

    })

    test('Should NOT be valid(no fee)', () => {
        const block = new Block({
            index: 1,
            previousHash: genesis.hash,
            transactions: [new Transaction({
                txInputs: [new TransactionInput()]
            } as Transaction)]
        } as Block)

        block.mine(exampleDifficulty, exampleMiner)
        const valid = block.isValid(genesis.hash, genesis.index, exampleDifficulty)
        // console.log(valid.message);
        expect(valid.success).toBeFalsy()

    })

    test('Should create from blockInfo', () => {
        const block = Block.fromBlockInfo({
            transactions: [new Transaction({
                txInputs: [new TransactionInput()]
            } as Transaction)],
            difficulty: 0,
            feePerTx: 1,
            index: 1,
            maxDifficulty: 62,
            previousHash: genesis.hash
        } as BlockInfo)

        block.transactions.push(new Transaction({
            type: TransactionType.FEE,
            txOutputs: [new TransactionOutput()]
        } as Transaction))

        block.hash = block.getHash()

        block.mine(exampleDifficulty, exampleMiner)

        const valid = block.isValid(genesis.hash, genesis.index, exampleDifficulty)
        expect(valid.success).toBeTruthy()

    })

    test('Should NOT be valid(2 FEE)', () => {
        const block = new Block({
            index: 1,
            previousHash: genesis.hash,
            transactions: [
                new Transaction({
                    type: TransactionType.FEE,
                    txInputs: [new TransactionInput()]
                } as Transaction), new Transaction({
                    type: TransactionType.FEE,
                    txInputs: [new TransactionInput()]
                } as Transaction)
            ]
        } as Block)
        block.mine(exampleDifficulty, exampleMiner)
        const valid = block.isValid(genesis.hash, genesis.index, exampleDifficulty)
        // console.log(valid.message);
        expect(valid.success).toBeFalsy()

    })

    test('Should NOT be valid(invalid tx)', () => {
        const block = new Block({
            index: 1,
            previousHash: genesis.hash,
            transactions: [] as Transaction[]
        } as Block)

        block.transactions.push(new Transaction({
            type: TransactionType.FEE,
            txOutputs: [new TransactionOutput()]
        } as Transaction))
        block.hash = block.getHash()

        block.mine(exampleDifficulty, exampleMiner)

        block.transactions[0].txOutputs[0].toAddress = ""

        const valid = block.isValid(genesis.hash, genesis.index, exampleDifficulty)
        // console.log(valid.message);
        expect(valid.success).toBeFalsy()

    })

    test('Should NOT be valid (fallbacks)', () => {
        const block = new Block()

        block.transactions.push(new Transaction({
            type: TransactionType.FEE,
            txOutputs: [new TransactionOutput()]
        } as Transaction))
        block.hash = block.getHash()

        const valid = block.isValid(genesis.hash, genesis.index, exampleDifficulty)
        expect(valid.success).toBeFalsy()
    })

    test('Should NOT be valid (previous hash)', () => {
        const block = new Block({
            index: 1,
            previousHash: "",
            transactions: [new Transaction({
                txInputs: [new TransactionInput()]
            } as Transaction)]
        } as Block)

        block.transactions.push(new Transaction({
            type: TransactionType.FEE,
            txOutputs: [new TransactionOutput()]
        } as Transaction))
        block.hash = block.getHash()
        block.mine(exampleDifficulty, exampleMiner)

        const valid = block.isValid(genesis.hash, genesis.index, exampleDifficulty)
        expect(valid.success).toBeFalsy()
    })

    test('Should NOT be valid (invalid timestamp)', () => {
        const block = new Block({
            index: 1,
            previousHash: genesis.hash,
            transactions: [new Transaction({
                txInputs: [new TransactionInput()]
            } as Transaction)]
        } as Block)

        block.transactions.push(new Transaction({
            type: TransactionType.FEE,
            txOutputs: [new TransactionOutput()]
        } as Transaction))
        block.hash = block.getHash()
        block.mine(exampleDifficulty, exampleMiner)

        block.timestamp = -1
        block.hash = block.getHash()
        const valid = block.isValid(genesis.hash, genesis.index, exampleDifficulty)
        expect(valid.success).toBeFalsy()
    })

    test('Should NOT be valid (empty hash)', () => {
        const block = new Block({
            index: 1,
            previousHash: genesis.hash,
            transactions: [new Transaction({
                txInputs: [new TransactionInput()]
            } as Transaction)]
        } as Block)

        block.transactions.push(new Transaction({
            type: TransactionType.FEE,
            txOutputs: [new TransactionOutput()]
        } as Transaction))
        block.hash = block.getHash()

        block.mine(exampleDifficulty, exampleMiner)
        block.hash = ""
        const valid = block.isValid(genesis.hash, genesis.index, exampleDifficulty)
        expect(valid.success).toBeFalsy()
    })

    test('Should NOT be valid (no miner)', () => {
        const block = new Block({
            index: 1,
            nonce: 0,
            miner: exampleMiner,
            previousHash: genesis.hash,
            transactions: [new Transaction({
                txInputs: [new TransactionInput()]
            } as Transaction)]
        } as Block)

        block.transactions.push(new Transaction({
            type: TransactionType.FEE,
            txOutputs: [new TransactionOutput()]
        } as Transaction))
        block.hash = block.getHash()
        block.mine(exampleDifficulty, exampleMiner)

        block.hash = ""
        const valid = block.isValid(genesis.hash, genesis.index, exampleDifficulty)
        expect(valid.success).toBeFalsy()
    })

    test('Should NOT be valid (txInput)', () => {
        const txInputs = [new TransactionInput()]
        txInputs[0].amount - 1

        const block = new Block({
            index: 1,
            previousHash: genesis.hash,
            transactions: [new Transaction({
                txInputs
            } as Transaction)]
        } as Block)

        block.transactions.push(new Transaction({
            type: TransactionType.FEE,
            txOutputs: [new TransactionOutput()]
        } as Transaction))
        block.hash = block.getHash()

        const valid = block.isValid(genesis.hash, genesis.index, exampleDifficulty)
        expect(valid.success).toBeFalsy()
    })

    test('Should NOT be valid (invalid index)', () => {
        const block = new Block({
            index: -1,
            previousHash: genesis.hash,
            transactions: [new Transaction({
                txInputs: [new TransactionInput()]
            } as Transaction)]
        } as Block)

        block.transactions.push(new Transaction({
            type: TransactionType.FEE,
            txOutputs: [new TransactionOutput()]
        } as Transaction))
        block.hash = block.getHash()
        block.mine(exampleDifficulty, exampleMiner)

        const valid = block.isValid(genesis.hash, genesis.index, exampleDifficulty)
        expect(valid.success).toBeFalsy()
    })

})