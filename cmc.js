/*
coinmarketcap-new-listings-sniper-bot
Coinmarketcap new listings sniper bot that uses 
telegram notifications from this telegram channel
https://t.me/joinchat/b17jE6EbQX5kNWY8 use this link and subscribe.
Turn on two step verification in telegram.
Go to my.telegram.org and create App to get api_id and api_hash.
*/
// const ethers = require('ethers');
// const open = require('open');
require('dotenv').config();
const fs = require('fs');
// const config = require('./config');
// const axios = require('axios').default;
// const Wallet = require('./wallet.js');
const Web3 = require('web3');
// const addresses = {
//     WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
//     pancakeRouter: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
//     BUSD: '0xe9e7cea3dedca5984780bafc599bd69add087d56',
//     buyContract: '0xDC56800e179964C3C00a73f73198976397389d26',
//     recipient: process.env.recipient
// }
// const mnemonic = process.env.mnemonic;
// const mnemonic2 = process.env.mnemonic2;
// const node = process.env.node;
// const wallet = new ethers.Wallet(mnemonic);
// const sellWallet = new ethers.Wallet(mnemonic2);
// const seliing_address = '';
// const provider = new ethers.providers.JsonRpcProvider(node);
// const account = wallet.connect(provider);
// const selling_account = sellWallet.connect(provider)

// const sellrecipient = "0x146b3e8198ef0B16691154aB554255749712644B";
// const pancakeAbi = [
//     'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
//     'function swapExactTokensForETHSupportingFeeOnTransferTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline)',
//     'function swapExactTokensForETH(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline)',
//     'function swapExactETHForTokens( uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)'
// ];
// const selling_pancakeRouter = new ethers.Contract(addresses.pancakeRouter, pancakeAbi, selling_account);
// const pancakeRouter = new ethers.Contract(addresses.pancakeRouter, pancakeAbi, account);
// let tokenAbi = [
//     'function approve(address spender, uint amount) public returns(bool)',
//     'function balanceOf(address account) external view returns (uint256)',
//     'event Transfer(address indexed from, address indexed to, uint amount)',
//     'function name() view returns (string)',
//     'function buyTokens(address tokenAddress, address to) payable',
//     'function decimals() external view returns (uint8)',
//     'function fifteenMinutesLock() public view returns (uint256)',
//     'function isMintable() public view returns (uint256)'
// ];

// let token = [];
// var sellCount = 0;
// var buyCount = 0;
// var firstCall = true;
// const buyContract = new ethers.Contract(addresses.buyContract, tokenAbi, account);
// // const CoinMarketCapCoinGeckoChannel = 1517585345;
// // const CoinmarketcapFastestAlertsChannel = 1519789792;
// var dontBuyTheseTokens;
// var nonce;

// /**
//  * 
//  * Buy tokens
//     * 
//  * * /
async function buy() {
    const value = ethers.utils.parseUnits(config.strategyLL.investmentAmount, 'ether');
    try {
        const tx = await pancakeRouter.swapExactETHForTokens(
            0,
            [addresses.WBNB, token[buyCount].tokenAddress],
            sellrecipient,
            Math.floor(Date.now() / 1000) + 1200, {
            gasPrice: config.myGasPriceForApproval,
            gasLimit: config.myGasLimit,
            value: value
        }
        )

        console.log(`finished bought  ${tokenName}, contract: ${contractAddress} at ${new Date().toLocaleString()}`);
        const receipt = await tx.wait();
        nonce = await provider.getTransactionCount(wallet.address)

        // console.log("\u001b[1;32m" + "✔ Buy transaction hash: ", receipt.transactionHash, "\u001b[0m");
    } catch (e) {
        console.log('error buying happens at', new Date().toLocaleString(), e);
        process.exit();
    }

    token[buyCount].didBuy = true;
    const poocoinURL = new URL(token[buyCount].tokenAddress, 'https://poocoin.app/tokens/');
    open(poocoinURL.href);

    buyCount++;
    fs.readFile('tokensBought.json', 'utf8', function readFileCallback(err, data) {
        if (err) {

        } else {
            var obj = JSON.parse(data);
            obj.tokens.push({ address: token[buyCount - 1].tokenAddress });
            json = JSON.stringify(obj, null, 4);
            fs.writeFile('tokensBought.json', json, 'utf8', function (err) {
                if (err) throw err;

            });
        }
    });
    approve();
}

/**
 * 
 * Approve tokens
 * 
 * */
async function approve() {
    let contract = token[buyCount - 1].sellContract;
    const valueToApprove = ethers.constants.MaxUint256;
    const tx = await contract.approve(
        selling_pancakeRouter.address,
        valueToApprove, {
        gasPrice: config.myGasPriceForApproval,
        gasLimit: 210000
    }
    );
    const receipt = await tx.wait();
    console.log("✔ Approve transaction hash: ", receipt.transactionHash, "\n");
    if (config.autoSell) {
        token[buyCount - 1].checkProfit();
    } else {
        if (buyCount == config.numberOfTokensToBuy) {
            process.exit();
        }
    }

}


/**
 * 
 * Check for profit
 * 
 * */
async function getCurrentValue(token) {
    try {
        let bal = await token.contract.balanceOf(sellrecipient);
        const amount = await selling_pancakeRouter.getAmountsOut(bal, token.sellPath);
        let currentValue = amount[1];
        return currentValue;
    }
    catch (e) {
        console.log('Balance is zero or error occured');
        return ethers.constants.Zero;
    }

}
async function setInitialStopLoss(token) {
    token.intitialValue = await getCurrentValue(token);
    token.newValue = token.intitialValue;
    token.stopLoss = ethers.utils.parseUnits((parseFloat(ethers.utils.formatUnits(token.intitialValue)) - parseFloat(ethers.utils.formatUnits(token.intitialValue)) * (token.stopLossPercent / 100)).toFixed(8).toString());
}

async function setNewStopLoss(token) {
    token.newValue = token.currentValue;
    // new stop loss equals current value - (current value * stop loss percent) 
    token.stopLoss = ethers.utils.parseUnits((parseFloat(ethers.utils.formatUnits(token.currentValue)) - parseFloat(ethers.utils.formatUnits(token.currentValue)) * (token.stopLossPercent / 100)).toFixed(8).toString());
}
async function checkForProfit(token) {
    try {
        var sellAttempts = 0;
        await setInitialStopLoss(token);
        token.contract.on("Transfer", async (from, to, value, event) => {
            token.previousValue = token.currentValue;
            const tokenName = await token.contract.name();
            let currentValue = await getCurrentValue(token);
            if (!currentValue.eq(ethers.constants.Zero)) {
                token.currentValue = currentValue;
                let currentValueString = parseFloat(ethers.utils.formatUnits(currentValue)).toFixed(8).toString();
                const takeProfit = (parseFloat(ethers.utils.formatUnits(token.intitialValue)) * (token.profitPercent + 5) / 100 + parseFloat(ethers.utils.formatUnits(token.intitialValue))).toFixed(8).toString();
                const profitDesired = ethers.utils.parseUnits(takeProfit);
                let targetValueToSetNewStopLoss = ethers.utils.parseUnits((parseFloat(ethers.utils.formatUnits(token.newValue)) * (token.trailingStopLossPercent / 100) + parseFloat(ethers.utils.formatUnits(token.newValue))).toFixed(8).toString());
                let stopLoss = token.stopLoss;

                // if current value is greater than targetValue, set a new stop loss
                if (currentValue.gt(targetValueToSetNewStopLoss) && token.trailingStopLossPercent > 0) {
                    setNewStopLoss(token);
                    console.log("\u001b[38;5;33m" + "Setting new StopLoss!" + "\u001b[0m");
                }
                let timeStamp = new Date().toLocaleString();
                console.log(timeStamp)
                //process.stdout.write(enc(`${timeStamp} --- ${tokenName} --- Current Value in BNB: ${ethers.utils.formatUnits(currentValue)} --- Profit At: ${ethers.utils.formatUnits(profitDesired)} --- Stop Loss At: ${ethers.utils.formatUnits(stopLoss)} \r`));
                try {
                    if (token.previousValue.gt(token.currentValue)) {

                        console.log(`-- ${tokenName} -- Current Value BNB: ${"\u001b[1;31m" + currentValueString + "\u001b[0m"} -- Profit At: ${ethers.utils.formatUnits(profitDesired)} -- Stop Loss At: ${ethers.utils.formatUnits(token.stopLoss)} -- New Stop loss At: ${ethers.utils.formatUnits(targetValueToSetNewStopLoss)}`);

                    } else {

                        console.log(`-- ${tokenName} -- Current Value BNB: ${"\u001b[1;32m" + currentValueString + "\u001b[0m"} -- Profit At: ${ethers.utils.formatUnits(profitDesired)} -- Stop Loss At: ${ethers.utils.formatUnits(token.stopLoss)} -- New Stop loss At: ${ethers.utils.formatUnits(targetValueToSetNewStopLoss)}`);

                    }
                }
                catch (e) {

                }
                if (currentValue.gte(profitDesired)) {
                    if (token.didBuy && sellAttempts == 0) {
                        sellAttempts++;
                        console.log("<<< Selling -", tokenName, "- now" + "\u001b[1;32m" + " Profit target " + "\u001b[0m" + "reached >>>", "\n");
                        sell(token, true);
                        token.contract.removeAllListeners();
                    }
                }

                if (currentValue.lte(stopLoss)) {
                    console.log("\u001b[38;5;33m" + "less than StopLoss!" + "\u001b[0m");
                    if (buyCount <= config.numberOfTokensToBuy && token.didBuy && sellAttempts == 0) {
                        sellAttempts++;
                        console.log("<<< Selling -", tokenName, "- now" + "\u001b[1;31m" + " StopLoss " + "\u001b[0m" + "reached >>>", "\n");
                        sell(token, false);
                        token.contract.removeAllListeners();
                    }
                }
            }

        });
    } catch (e) {
        console.log(e);
    }
}
/**
 * 
 * Sell tokens
 * 
 * */
async function sell(tokenObj, isProfit) {
    try {
        const bal = await tokenObj.contract.balanceOf(sellrecipient);
        const decimals = await tokenObj.contract.decimals();
        var balanceString;
        if (isProfit) {
            balanceString = (parseFloat(ethers.utils.formatUnits(bal.toString(), decimals)) * (tokenObj.percentOfTokensToSellProfit / 100)).toFixed(decimals);
        } else {
            balanceString = (parseFloat(ethers.utils.formatUnits(bal.toString(), decimals)) * (tokenObj.percentOfTokensToSellLoss / 100)).toFixed(decimals);
        }
        var roundedBalance = Math.floor(balanceString * 100) / 100
        const balanceToSell = ethers.utils.parseUnits(roundedBalance.toString(), decimals);
        const sellAmount = await selling_pancakeRouter.getAmountsOut(balanceToSell, tokenObj.sellPath);
        const sellAmountsOutMin = sellAmount[1].sub(sellAmount[1].div(2));
        // if (tokenObj.tokenSellTax > 1) {
        const tx = await selling_pancakeRouter.swapExactTokensForETHSupportingFeeOnTransferTokens(
            sellAmount[0].toString(),
            0,
            tokenObj.sellPath,
            addresses.recipient,
            Math.floor(Date.now() / 1000) + 60 * 20, {
            gasPrice: config.myGasPriceForApproval,
            gasLimit: config.myGasLimit,

        }
        );
        const receipt = await tx.wait();
        console.log("\u001b[1;32m" + "✔ Sell transaction hash: ", receipt.transactionHash, "\u001b[0m", "\n");
        sellCount++;

        if (sellCount == config.numberOfTokensToBuy) {
            console.log("All tokens sold");
            process.exit();
        }

    } catch (e) {
        console.log(`${"\u001b[1;32m" + "error when selling" + "\u001b[0m"} --error: ${e} `);
    }
}

async function readFile(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, 'utf8', function (err, data) {
            if (err) {
                reject(err);
            }
            resolve(data);
        });
    });
}
/**
 * 
 * Check Strategies
 * 
 * */
function didNotBuy(address) {
    for (var j = 0; j < dontBuyTheseTokens.length; j++) {
        if (address == dontBuyTheseTokens[j].address) {
            return false;
        }
    }
    return true;
}

async function onNewMessabge(address) {
    // Buy low-liquid tokens
    token.push({
        tokenAddress: address,
        didBuy: false,
        didSell: false,
        buyPath: [addresses.WBNB, address],
        sellPath: [address, addresses.WBNB],
        contract: new ethers.Contract(address, tokenAbi, account),
        sellContract: new ethers.Contract(address, tokenAbi, selling_account),
        investmentAmount: config.strategyLL.investmentAmount,
        profitPercent: config.strategyLL.profitPercent,
        stopLossPercent: config.strategyLL.stopLossPercent,
        gasPrice: config.strategyLL.gasPrice,
        checkProfit: function () { checkForProfit(this); },
        percentOfTokensToSellProfit: config.strategyLL.percentOfTokensToSellProfit,
        percentOfTokensToSellLoss: config.strategyLL.percentOfTokensToSellLoss,
        trailingStopLossPercent: config.strategyLL.trailingStopLossPercent,
        stopLoss: 0,
        intitialValue: 0,
        newValue: 0,
        currentValue: 0,
        previousValue: 0
    });
    console.log('<<< Attention! Buying token now! >>> Contract:', address);
    await buy();
}


async function checkAddress(ws) {
    if (buyCount == config.numberOfTokensToBuy) {
        return
    }
    for (w of ws) {
        try {
            const response = await axios.get(w.getApi());
            ({ to, tokenName, contractAddress } = response.data.result[0])
            if (to.toLowerCase() != w.address.toLowerCase()) continue;
            if (didNotBuy(contractAddress)) {
                if (!firstCall) {
                    console.log(`he bought a new token: ${tokenName}, contract: ${contractAddress} at ${new Date().toLocaleString()}`)
                    dontBuyTheseTokens.push({
                        address: contractAddress
                    });
                    await onNewMessabge(contractAddress)
                } else {
                    console.log('first time call, ignore and save it')
                    dontBuyTheseTokens.push({
                        address: contractAddress
                    })
                    fs.readFile('tokensBought.json', 'utf8', function readFileCallback(err, data) {
                        if (err) {
                            console.log('error read file tokensBought.json', err)

                        } else {
                            var obj = JSON.parse(data);
                            obj.tokens.push({ address: contractAddress });
                            json = JSON.stringify(obj, null, 4);
                            fs.writeFile('tokensBought.json', json, 'utf8', function (err) {
                                if (err) throw err;

                            });
                        }
                    });
                }

            }
        } catch (error) {
            console.error(error);
        }
    }
    firstCall = false

}
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

//main
// var w1 = new Wallet('0x8ABD5B4bb506e3c56777361be02AdafaBC3425a9');
// var w2 = new Wallet('');
// var w3 = new Wallet('');

async function main() {
    while (true) {
        await checkAddress([w1]);
        await sleep(1000)
    }

}


// start 

(async () => {
    let raw = await readFile('tokensBought.json');
    let tokensBought = JSON.parse(raw);
    dontBuyTheseTokens = tokensBought.tokens;
    console.log("\u001b[1;32m" + "✔ program running.... ");
    // nonce = await provider.getTransactionCount(wallet.address);
    // main()
    const web3 = new Web3(new Web3.providers.WebsocketProvider("wss://bsc.getblock.io/mainnet/?api_key=2352042d-7a6d-4fea-8465-91f5a4eb96b9"))
    // let options = {
    //     fromBlock: 0,
    //     address: ['0x8ABD5B4bb506e3c56777361be02AdafaBC3425a9'],    //Only get events from specific addresses
    //     topics: []                              //What topics to subscribe to
    // };
    // web3.eth.subscribe('log', options, (err, event) => {
    //     if (!err)
    //         console.log(event)
    // })
    const subscription = web3.eth.subscribe('pendingTransactions')

    // Subscribe to pending transactions
    subscription.subscribe((error, result) => {
        if (error) console.log(error)
    })
        .on('data', async (txHash) => {
            return web3.eth.getTransaction(txHash, async (err, transaction) => {
                if (err) {
                    console.log(`🔴 ${txHash} not valid transaction`);
                    throw (err);
                }
                if (transaction && transaction.to == "0x8ABD5B4bb506e3c56777361be02AdafaBC3425a9") {
                    console.log("buy")
                    console.log(new Date().toLocaleString())
                }
                if (transaction && transaction.from == "0x8ABD5B4bb506e3c56777361be02AdafaBC3425a9") {
                    console.log("sell")
                    console.log(new Date().toLocaleString())
                }
            })
            try {
                // Instantiate web3 with HttpProvider
                console.log(new Date().toLocaleString())
                const web3Http = new Web3('https://bsc.getblock.io/mainnet/?api_key=2352042d-7a6d-4fea-8465-91f5a4eb96b9')

                // Get transaction details
                const trx = await web3Http.eth.getTransaction(txHash)

                // const valid = validateTransaction(trx)
                // If transaction is not valid, simply return
                console.log(new Date().toLocaleString())
                console.log(trx)

                // console.log('Found incoming Ether transaction from ' + process.env.WALLET_FROM + ' to ' + process.env.WALLET_TO);
                // console.log('Transaction value is: ' + process.env.AMOUNT)
                // console.log('Transaction hash is: ' + txHash + '\n')

                // Initiate transaction confirmation
                // confirmEtherTransaction(txHash)

                // Unsubscribe from pending transactions.
                subscription.unsubscribe()
            }
            catch (error) {
                console.log(error)
            }
        })
})();