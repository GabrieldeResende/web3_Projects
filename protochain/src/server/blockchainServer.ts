import dotenv from "dotenv"
dotenv.config()

import express, { NextFunction, Request, Response } from "express"
import morgan from "morgan"
import Blockchain from "../lib/blockchain"
import Block from "../lib/block"
import Transaction from "../lib/transaction"
import Wallet from "../lib/wallet"
import TransactionOutput from "../lib/transactionOutput"

/* c8 ignore next */
const PORT: number = parseInt(`${process.env.BLOCKCHAIN_PORT || 3000}`)

const app = express()


/* c8 ignore start */
if (process.argv.includes("--run"))
    app.use(morgan('tiny'))
/* c8 ignore end */

app.use(express.json())

const wallet = new Wallet(process.env.BLOCKCHAIN_WALLET)
const blockchain = new Blockchain(wallet.publicKey)

app.get('/status', (req: Request, res: Response, next: NextFunction) => {
    res.json({
        mempool: blockchain.mempool.length,
        blocks: blockchain.blocks.length,
        isValid: blockchain.isValid(),
        lastBlock: blockchain.getLastBlock()
    })
})

app.get('/block/next', (req: Request, res: Response, next: NextFunction) => {
    res.json(blockchain.getNextBlock())
})

app.get('/blocks/:indexOrHash', (req: Request, res: Response, next: NextFunction) => {
    let block;
    if (/^[0-9]+$/.test(req.params.indexOrHash))
        block = blockchain.blocks[parseInt(req.params.indexOrHash)]
    else
        block = blockchain.getBlock(req.params.indexOrHash)

    if (!block)
        return res.sendStatus(404)
    else
        return res.json(block)
})


app.get('/transaction', (req: Request, res: Response, next: NextFunction) => {
    res.json({
        next: blockchain.mempool.slice(0, Blockchain.TX_PER_BLOCK),
        total: blockchain.mempool.length
    })
})

app.get('/transaction:hash?', (req: Request, res: Response, next: NextFunction) => {

    if (req.params.hash) {
        res.json(blockchain.getTransaction(req.params.hash))
    } else {
        res.json({
            next: blockchain.mempool.slice(0, Blockchain.TX_PER_BLOCK),
            total: blockchain.mempool.length
        })
    }
})

app.post('/blocks', (req: Request, res: Response, next: NextFunction) => {
    if (req.body.hash === undefined) return res.sendStatus(422)

    const block = new Block(req.body as Block)
    const validation = blockchain.addBlock(block)

    if (validation.success)
        res.status(201).json(block)
    else
        res.status(400).json(validation)
})

app.post('/transactions', (req: Request, res: Response, next: NextFunction) => {
    if (req.body.hash === undefined) return res.sendStatus(422)

    const tx = new Transaction(req.body as Transaction)
    const validation = blockchain.addTransaction(tx)

    if (validation.success)
        res.status(201).json(tx)
    else
        res.status(400).json(validation)
})

app.get('/wallets/:wallet', (req: Request, res: Response, next: NextFunction) => {
    const wallet = req.params.wallet

    return res.json({
        balance: 10,
        fee: blockchain.getFeePerTx(),
        utxo: [new TransactionOutput({
            amount: 10,
            toAddress: wallet,
            tx: "abc"
        } as TransactionOutput)]
    })
})

/* c8 ignore start */
if (process.argv.includes("--run"))
    app.listen(PORT, () => { console.log(`Blockchain Server is running at ${PORT}`) })
/* c8 ignore end */

export {
    app
}