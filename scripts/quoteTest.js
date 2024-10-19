const { ethers } = require('ethers');
require('dotenv').config();

const {
  abi: QUOTER_ABI,
} = require('@uniswap/v3-periphery/artifacts/contracts/lens/QuoterV2.sol/QuoterV2.json');

const QUOTER_ADDRESS = '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a'; // Uniswap V3 Quoter contract address
const WETH9_ADDRESS = '0x4200000000000000000000000000000000000006'; // WETH9 address
const CBETH_ADDRESS = '0x2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22'; // cbETH address
const FEE_TIER = '3000'; // Pool fee

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.BASE_MAINNET_URL
  );

  // Create an instance of the Quoter contract
  const quoterContract = new ethers.Contract(
    QUOTER_ADDRESS,
    QUOTER_ABI,
    provider
  );

  // Parameters for WETH -> cbETH swap
  const wethToCbethParams = {
    tokenIn: WETH9_ADDRESS,
    tokenOut: CBETH_ADDRESS,
    fee: FEE_TIER,
    amountIn: ethers.utils.parseEther('1'), // 1 WETH
    sqrtPriceLimitX96: '0',
  };

  try {
    // Call the quoteExactInputSingle function for WETH -> cbETH
    const quotedResultWethToCbeth =
      await quoterContract.callStatic.quoteExactInputSingle(wethToCbethParams);

    console.log('-'.repeat(30));
    console.log(`1 WETH -> cbETH:`);

    console.log(
      `Quoted amount out (cbETH): ${ethers.utils.formatEther(
        quotedResultWethToCbeth.amountOut
      )} cbETH`
    );
    // console.log(`Sqrt Price After: ${quotedResultWethToCbeth.sqrtPriceX96After.toString()}`);
    // console.log(`Initialized Ticks Crossed: ${quotedResultWethToCbeth.initializedTicksCrossed}`);
    console.log(
      `Gas Estimate: ${quotedResultWethToCbeth.gasEstimate.toString()} gas units`
    );
    console.log('-'.repeat(30));

    // Parameters for cbETH -> WETH swap
    const cbethToWethParams = {
      tokenIn: CBETH_ADDRESS,
      tokenOut: WETH9_ADDRESS,
      fee: FEE_TIER,
      amountIn: ethers.utils.parseEther('1'), // Use the quoted cbETH amount from the first swap
      sqrtPriceLimitX96: '0',
    };

    // Call the quoteExactInputSingle function for cbETH -> WETH
    const quotedResultCbethToWeth =
      await quoterContract.callStatic.quoteExactInputSingle(cbethToWethParams);

    console.log(`1 cbETH -> WETH:`);

    console.log(
      `Quoted amount out (WETH): ${ethers.utils.formatEther(
        quotedResultCbethToWeth.amountOut
      )} WETH`
    );
    // console.log(`Sqrt Price After: ${quotedResultCbethToWeth.sqrtPriceX96After.toString()}`);
    // console.log(`Initialized Ticks Crossed: ${quotedResultCbethToWeth.initializedTicksCrossed}`);
    console.log(
      `Gas Estimate: ${quotedResultCbethToWeth.gasEstimate.toString()} gas units`
    );
    console.log('-'.repeat(30));
  } catch (error) {
    console.error('Error fetching quote:', error);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
