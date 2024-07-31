import dotenv from 'dotenv';
dotenv.config()

import axios from 'axios';
import readline from 'readline'
import Wallet from "../lib/wallet";
import Transaction from '../lib/transaction';
import TransactionType from '../lib/transactionType';
import TransactionInput from '../lib/transactionInput';
import TransactionOutput from '../lib/transactionOutput';


const BLOCKCHAIN_SERVER = process.env.BLOCKCHAIN_SERVER

let myWalletPub = ""
let myWalletPriv = ""

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

function menu() {
    setTimeout(() => {
        console.clear()

        if (myWalletPub)
            console.log(`You are logged as ${myWalletPub}`);
        else
            console.log(`You are NOT logged`);

        console.log("1 - Create Wallet");
        console.log("2 - Recover Wallet");
        console.log("3 - Balance");
        console.log("4 - Send tx");
        console.log("5 - Search tx");
        rl.question("Choose your option: ", (answer) => {
            switch (answer) {
                case "1":
                    createWallet()
                    break
                case "2":
                    recoverWallet()
                    break
                case "3":
                    getBalance()
                    break
                case "4":
                    sendTx()
                    break
                case "2":
                    searchTx()
                    break
                default: {
                    console.log("Wrong option");
                    menu()
                }
            }
        })


    }, 1000)
}

function preMenu() {
    rl.question(`Press any key to continue...`, () => {
        menu()
    })
}

function createWallet() {
    console.clear()
    const wallet = new Wallet()
    console.log("Your new wallet: ");
    console.log(wallet);

    myWalletPub = wallet.publicKey
    myWalletPriv = wallet.privateKey
    preMenu()

}

function recoverWallet() {
    console.clear()
    rl.question(`What is your private key or WIF: `, (wifOrPrivateKey) => {
        const wallet = new Wallet(wifOrPrivateKey)
        console.log("Your recovered wallet: ");
        console.log(wallet);

        myWalletPub = wallet.publicKey
        myWalletPriv = wallet.privateKey
        preMenu()
    })
}

function getBalance() {
    console.clear()

    if (!myWalletPub) {
        console.log("You dont have a wallet yet");
        return preMenu()
    }

    // ToDo: get balance by API
    preMenu()
}

function sendTx() {
    console.clear()

    if (!myWalletPub) {
        console.log("You dont have a wallet yet");
        return preMenu()
    }

    console.log(`Your wallet is ${myWalletPub}`);
    rl.question(`To Wallet: `, (toWallet) => {
        if (toWallet.length < 66) {
            console.log("Invalid Wallet");
            preMenu()
        }

        rl.question(`Amount`, async (amountStr) => {
            const amount = parseInt(amountStr)
            if (!amount) {
                console.log("Invalid amount");
                preMenu()
            }

            const walletResponse = await axios.get(`${BLOCKCHAIN_SERVER}/wallet/${myWalletPub}`)
            const balance = walletResponse.data.balance as number
            const fee = walletResponse.data.fee as number
            const utxo = walletResponse.data.utxo as TransactionOutput[]

            if(balance < amount + fee){
                console.log("Insufficient balance (tx + fee)");
                preMenu()
            }

            const tx = new Transaction()
            tx.timestamp = Date.now()
            tx.txOutputs = [new TransactionOutput({
                toAddress: toWallet,
                amount
            } as TransactionOutput)]
            tx.type = TransactionType.REGULAR
            tx.txInputs = [new TransactionInput({
                amount,
                fromAddress: myWalletPub,
                previousTx: utxo[0].tx
            } as TransactionInput)]

            tx.txInputs[0].sign(myWalletPriv)
            tx.hash = tx.getHash()
            tx.txOutputs[0].tx = tx.hash

            try {
                const txResponse = await axios.post(`${BLOCKCHAIN_SERVER}transactions/`, tx)
                console.log("Transaction accept. Waiting the minners...");
                console.log(txResponse.data.hash);


            } catch (err: any) {
                console.error(err.response ? err.response.data : err.message);
            }
            return preMenu()
        })
    })



    preMenu()
}

function searchTx() {
        console.clear()
        rl.question(`Your tx hash:`, async (hash) => {
            const response = await axios.get(`${BLOCKCHAIN_SERVER}transaction/${hash}`)
            console.log(response.data);
            return preMenu()
        })    
}

menu()
