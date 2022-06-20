const ethers = require('ethers');
module.exports.numberOfTokensToBuy = 10; // number of different tokens you want to buy

module.exports.autoSell = true;  // If you want to auto sell or not 

module.exports.myGasPriceForApproval = ethers.utils.parseUnits('10', 'gwei'); // Gas to approve and sell

module.exports.myGasLimit = 2000000; // gas limit doesnt need to be changed if too low transaction will fail

module.exports.strategyLL =
{
    investmentAmount: '0.005', 	// Investment amount per token
    maxBuyTax: 2, 			// max buy tax
    minBuyTax: 0,			// min buy tax
    maxSellTax: 2,			// max sell tax
    minSellTax: 0,           // min sell tax
    maxLiquidity: 250,	        // max Liquidity BNB
    minLiquidity: 45, 	  	// min Liquidity BNB
    profitPercent: 300,          // 2.5X
    stopLossPercent: 30,        // 30% loss
    platform: "COINMARKETCAP",      // Either COINMARKETCAP or COINGECKO
    gasPrice: ethers.utils.parseUnits('9', 'gwei'), // Gas Price. Higher is better for low liquidity
    percentOfTokensToSellProfit: 60, // sell 75% when profit is reached
    percentOfTokensToSellLoss: 60, // sell 100% when stoploss is reached 
    trailingStopLossPercent: 5 // % trailing stoploss
}
module.exports.whale_wallets = ['0x8ABD5B4bb506e3c56777361be02AdafaBC3425a9', '0x362798e7De000A06C5894574Df55e493A4B4DD80', '0xC94e9c7ECD937f706750FFEe835dD7907DE5cAc2']