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

async function getQuoteETHToCbETHExactIn(amountIn) {
  const params = {
    tokenIn: WETH9_ADDRESS,
    tokenOut: CBETH_ADDRESS,
    fee: FEE_TIER,
    amountIn: ethers.parseEther(amountIn),
    sqrtPriceLimitX96: '0'
  };
  return await quoterContract.quoteExactInputSingle.staticCall(params);
}

async function getQuoteCbETHToETHExactIn(amountIn) {
  const params = {
    tokenIn: CBETH_ADDRESS,
    tokenOut: WETH9_ADDRESS,
    fee: FEE_TIER,
    amountIn: ethers.parseEther(amountIn),
    sqrtPriceLimitX96: '0'
  };
  return await quoterContract.quoteExactInputSingle.staticCall(params);
}

async function getQuoteCbETHToETHExactOut(amountOut) {
  const params = {
    tokenIn: CBETH_ADDRESS,
    tokenOut: WETH9_ADDRESS,
    fee: FEE_TIER,
    amount: ethers.parseEther(amountOut),
    sqrtPriceLimitX96: '0'
  };
  return await quoterContract.quoteExactOutputSingle.staticCall(params);
}

async function main() {
  const ETHswapAmount = '0.0001';
  const CbETHswapAmount = '0.00009211748539739';
  const ETHAmountOut = '0.0002';

  try {
    console.log('-'.repeat(30));

    // use below to estimate minimum cbETH to receive (stake)
    const quoteETHToCbETHExactIn = await getQuoteETHToCbETHExactIn(ETHswapAmount);
    console.log(`${ETHswapAmount} WETH -> cbETH Exact In: ${ethers.formatEther(quoteETHToCbETHExactIn.amountOut)} cbETH`);
    console.log('-'.repeat(30));

    // use below to calculate ETH to receive from exact cbETH (withdraw yield)
    const quoteCbETHToETHExactIn = await getQuoteCbETHToETHExactIn(CbETHswapAmount);
    console.log(`${CbETHswapAmount} cbETH -> WETH Exact In: ${ethers.formatEther(quoteCbETHToETHExactIn.amountOut)} WETH`);
    console.log('-'.repeat(30));

    // use below to estimate cbETH to send back according to initial staked amount (unstake)
    const quoteCbETHToETHExactOut = await getQuoteCbETHToETHExactOut(ETHAmountOut);
    console.log(`${ethers.formatEther(quoteCbETHToETHExactOut.amountIn)} cbETH -> WETH Exact Out: ${ETHAmountOut} WETH`);
    console.log('-'.repeat(30));

  } catch (error) {
    console.error('Error fetching quote:', error);
  }

}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
