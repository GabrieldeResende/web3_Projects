import { describe, test, expect, jest } from '@jest/globals';
import request from "supertest"
import {app} from "../src/server/blockchainServer"
import Block from '../src/lib/block';
import Transaction from '../src/lib/transaction';
import TransactionInput from '../src/lib/transactionInput';
import TransactionOutput from '../src/lib/transactionOutput';

jest.mock("../src/lib/block")
jest.mock("../src/lib/blockchain")
jest.mock("../src/lib/transaction")
jest.mock("../src/lib/transactionInput")
jest.mock("../src/lib/transactionOutput")

describe("BlockChainServer tests", () => {

    test("GET/status (should return status)", async () => {
        const response = await request(app).get('/status/')

        expect(response.status).toEqual(200)
        expect(response.body.isValid.success).toEqual(true)
    })

    test("GET/block/:index (should get genesis)", async () => {
        const response = await request(app).get('/blocks/0')

        expect(response.status).toEqual(200)
        expect(response.body.index).toEqual(0)
    })

    test("GET/block/next (should get next block info)", async () => {
        const response = await request(app).get('/blocks/next')

        expect(response.status).toEqual(200)
        expect(response.body.index).toEqual(1)
    })

    test("GET/block/:hash (should get genesis)", async () => {
        const response = await request(app).get('/blocks/abc')

        expect(response.status).toEqual(200)
        expect(response.body.hash).toEqual("abc")
    })

    test("GET/block/:index (should NOT get block)", async () => {
        const response = await request(app).get('/blocks/-1')

        expect(response.status).toEqual(404)
    })

    test("POST/block/ (should add block)", async () => {
        const block = new Block({
            index: 1
        } as Block)
        const response = await request(app).post('/blocks').send(block)

        expect(response.status).toEqual(201)
        expect(response.body.index).toEqual(1)
    })

    test("POST/block/ (should NOT add block (empty))", async () => {
        const response = await request(app).post('/blocks').send({})

        expect(response.status).toEqual(422)
    })
    
    test("POST/block/ (should NOT add block (invalid))", async () => {
        const block = new Block({
            index: -1
        } as Block)
        const response = await request(app).post('/blocks').send(block)

        expect(response.status).toEqual(400)
    })

    test("GET /transactions/:hash - Should get transaction", async() => {
        const response = await request(app).get('/transactions/abc')

        expect(response.status).toEqual(200)
        expect(response.body.mempoolIndex).toEqual(0)
    })

    test("POST/transactions/ (should add tx)", async () => {
        const tx = new Transaction({
            txInputs: [new TransactionInput()],
            txOutputs: [new TransactionOutput()]
        } as Transaction)
        const response = await request(app).post('/transactions').send(tx)

        expect(response.status).toEqual(201)
        expect(response.body.index).toEqual(1)
    })
})