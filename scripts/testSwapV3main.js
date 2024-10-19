const { ethers } = require('ethers');
require('dotenv').config();

const {
    abi: QUOTER_ABI,
} = require('@uniswap/v3-periphery/artifacts/contracts/lens/QuoterV2.sol/QuoterV2.json');

const { abi: SWAPV3_ABI } = require('../artifacts/contracts/SwapV3.sol/SwapV3.json');

const QUOTER_ADDRESS = '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a'; // Uniswap V3 Quoter contract address
const WETH9_ADDRESS = '0x4200000000000000000000000000000000000006'; // WETH9 address
const CBETH_ADDRESS = '0x2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22'; // cbETH address
const SWAPV3_ADDRESS = '0xb03A1229B8B71cD5C97Abd10BE0238700970a770';
const FEE_TIER = '3000'; // Pool fee

const provider = new ethers.JsonRpcProvider(
    process.env.BASE_MAINNET_URL
);

const quoterContract = new ethers.Contract(
    QUOTER_ADDRESS,
    QUOTER_ABI,
    provider
);

const swapV3Contract = new ethers.Contract(SWAPV3_ADDRESS, SWAPV3_ABI, provider);

async function getQuoteETHToCbETH(amountIn) {
    const params = {
        tokenIn: WETH9_ADDRESS,
        tokenOut: CBETH_ADDRESS,
        fee: FEE_TIER,
        amountIn: ethers.parseEther(amountIn),
        sqrtPriceLimitX96: '0'
    };
    return await quoterContract.quoteExactInputSingle.staticCall(params);
}

async function getQuoteCbETHToETH(amountIn) {
    const params = {
        tokenIn: CBETH_ADDRESS,
        tokenOut: WETH9_ADDRESS,
        fee: FEE_TIER,
        amountIn: ethers.parseEther(amountIn),
        sqrtPriceLimitX96: '0'
    };
    return await quoterContract.quoteExactInputSingle.staticCall(params);
}

async function swapETHToCbETH(swapV3Contract, amountInETH, amountOutMinimum) {
    const tx = await swapV3Contract.swapETHToCbETH.staticCall(amountOutMinimum, {
        value: ethers.parseEther(amountInETH),
    });

    return tx;
}

async function swapCbETHToETH(swapV3Contract, amountInCbETH, amountOutMinimum) {
    const tx = await swapV3Contract.swapCbETHToETH.staticCall(amountOutMinimum, {
        value: ethers.parseEther(amountInCbETH),
    });

    return tx;
}

async function main() {
    const ETHswapAmount = '0.0001';
    const CbETHswapAmount = '0.00009211748539739';

    try {
        console.log('-'.repeat(30));

        const quoteETHToCbETH = await getQuoteETHToCbETH(ETHswapAmount);
        console.log(`${ETHswapAmount} WETH -> cbETH: ${ethers.formatEther(quoteETHToCbETH.amountOut)} cbETH`);
        console.log('-'.repeat(30));

        const quoteCbETHToETH = await getQuoteCbETHToETH(CbETHswapAmount);
        console.log(`${CbETHswapAmount} cbETH -> WETH: ${ethers.formatEther(quoteCbETHToETH.amountOut)} WETH`);
        console.log('-'.repeat(30));

        // const swapResult = await swapETHToCbETH(swapV3Contract, ETHswapAmount, quoteCbETHToETH.amountOut);
        // console.log(`Swapped ${ETHswapAmount} ETH to cbETH:`, swapResult);
        // console.log('-'.repeat(30));

        const swapResult = await swapETHToCbETH(swapV3Contract, CbETHswapAmount, quoteCbETHToETH.amountOut);
        console.log(`Swapped ${CbETHswapAmount} ETH to cbETH:`, swapResult);
        console.log('-'.repeat(30));
    } catch (error) {
        console.error('Error fetching quote:', error);
    }

}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
