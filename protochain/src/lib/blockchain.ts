import Block from './block'
import Validation from './validation';
import BlockInfo from './blockInfo';
import Transaction from './transaction';
import TransactionType from './transactionType';
import TransactionSearch from './transactionSearch';
import TransactionOutput from './transactionOutput';

/**
 * Blockchain class
 */

export default class Blockchain {
    blocks: Block[]
    mempool: Transaction[]
    nextIndex: number = 0;
    static readonly DIFFICULTY_FACTOR = 5
    static readonly TX_PER_BLOCK = 2
    static readonly MAX_DIFFICULTY = 62

    /**
     * Creates a new Blockchain
     */

    constructor(miner: string) {
        this.blocks = []
        this.mempool = []

        const genesis = this.createGenesis(miner)
        this.blocks.push(genesis)
        this.nextIndex++;
    }

    createGenesis(miner: string): Block {
        const amount = 10
        const tx = new Transaction({
            type: TransactionType.FEE,
            txOutputs: [new TransactionOutput({
                amount,
                toAddress: miner
            } as TransactionOutput)]
        } as Transaction)

        tx.hash = tx.getHash()
        tx.txOutputs[0].tx = tx.hash

        const block = new Block()
        block.transactions = [tx]
        block.mine(this.getDifficulty(), miner)
        return block
    }

    getLastBlock(): Block {
        return this.blocks[this.blocks.length - 1]
    }

    getDifficulty(): number {
        return Math.ceil(this.blocks.length / Blockchain.DIFFICULTY_FACTOR) + 1
    }

    addTransaction(transaction: Transaction): Validation {
        if (transaction.txInputs && transaction.txInputs.length) {
            const from = transaction.txInputs[0].fromAddress
            const pedingTx = this.mempool
                .filter(tx => tx.txInputs && tx.txInputs.length)
                .map(tx => tx.txInputs)
                .flat()
                .filter(txi => txi!.fromAddress === from)

            if (pedingTx && pedingTx.length)
                return new Validation(false, "This wallet has a pending transaction")

            //ToDo: validar a origem dos fundos
        }
        const validantion = transaction.isValid()
        if (!validantion.success)
            return new Validation(false, "Invalid tx:" + validantion.message)

        if (this.blocks.some(b => b.transactions.some(tx => tx.hash === transaction.hash)))
            return new Validation(false, "duplicated tx in blockchain:")

        this.mempool.push(transaction)
        return new Validation(true, transaction.hash)
    }

    addBlock(block: Block): Validation {
        const nextBlock = this.getNextBlock()
        if(!nextBlock)
            return new Validation(false, "There is no next block info...")

        const validation = block.isValid(nextBlock.previousHash, nextBlock.index - 1, nextBlock.difficulty)

        if (!validation.success) {
            return new Validation(false, `Invalid Block: ${validation.message}`);
        }

        const txs = block.transactions.filter(tx => tx.type !== TransactionType.FEE).map(tx => tx.hash)
        const newMempool = this.mempool.filter(tx => !txs.includes(tx.hash))
        if (newMempool.length + txs.length !== this.mempool.length)
            return new Validation(false, `Invalid tx in block: mempool`);
        this.mempool = newMempool

        this.blocks.push(block)
        this.nextIndex++;

        return new Validation(true, block.hash)
    }

    getBlock(hash: string): Block | undefined {
        return this.blocks.find(b => b.hash === hash)
    }

    getTransaction(hash: string): TransactionSearch {
        const mempoolIndex = this.mempool.findIndex(tx => tx.hash === hash)
        if (mempoolIndex !== -1)
            return { mempoolIndex, transaction: this.mempool[mempoolIndex] } as TransactionSearch

        const blockIndex = this.blocks.findIndex(b => b.transactions.some(tx => tx.hash === hash))
        if (blockIndex !== -1) {
            return { blockIndex, transaction: this.blocks[blockIndex].transactions.find(tx => tx.hash === hash) } as TransactionSearch
        }

        return { blockIndex: -1, mempoolIndex: -1 } as TransactionSearch
    }

    isValid(): Validation {
        for (let i = this.blocks.length - 1; i > 0; i--) {
            const currentBlock = this.blocks[i]
            const previousBlock = this.blocks[i - 1]
            const validantion = currentBlock.isValid(previousBlock.hash, previousBlock.index, this.getDifficulty())
            if (!validantion.success) {
                return new Validation(false, `Invalid Block: ${currentBlock.index} ${validantion.message}`);
            }
        }
        return new Validation();
    }

    getFeePerTx(): number {
        return 1
    }

    getNextBlock(): BlockInfo | null {

        if (!this.mempool || !this.mempool.length)
            return null


        const transactions = this.mempool.slice(0, Blockchain.TX_PER_BLOCK)
        const difficulty = this.getDifficulty()
        const previousHash = this.getLastBlock().hash
        const index = this.blocks.length
        const feePerTx = this.getFeePerTx()
        const maxDifficulty = Blockchain.MAX_DIFFICULTY

        return {
            transactions,
            difficulty,
            previousHash,
            index,
            feePerTx,
            maxDifficulty
        } as BlockInfo;
    }
}