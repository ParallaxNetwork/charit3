require('dotenv').config();
const { ethers } = require('hardhat');
const { Token, TradeType, Percent, CurrencyAmount } = require('@uniswap/sdk-core');
const { Route, Trade, SwapRouter } = require('@uniswap/v3-sdk');
const IUniswapV3PoolABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json');
const Quoter = require('@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json');


async function main() {
    const [signer] = await ethers.getSigners();

    const UNISWAP_ROUTER_ADDRESS = '0x2626664c2603336E57B271c5C0b26F421741e481';
    const WETH9Address = '0x4200000000000000000000000000000000000006';
    const cbETHAddress = '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22';
    const currentPoolAddress = '0x10648ba41b8565907cfa1496765fa4d95390aa0d';

    const cbETH = new Token(1, cbETHAddress, 18, 'cbETH', 'Coinbase Wrapped ETH');
    const WETH9 = new Token(1, WETH9Address, 18, 'WETH', 'Wrapped Ether');

    const WETH9Contract = await ethers.getContractAt('IWETH9', WETH9Address, signer);
    const swapRouter = await ethers.getContractAt('ISwapRouter', UNISWAP_ROUTER_ADDRESS, signer);
    const poolContract = await ethers.getContractAt(
        IUniswapV3PoolABI.abi,
        currentPoolAddress
    );

    const quoterContract = await ethers.getContractAt(
        Quoter.abi,
        '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a'
    );

    const [token0, token1, fee, liquidity, slot0] = await Promise.all([
        poolContract.token0(),
        poolContract.token1(),
        poolContract.fee(),
        poolContract.liquidity(),
        poolContract.slot0(),
    ]);

    const amountInETH = ethers.parseEther('0.0001');

    // await WETH9Contract.deposit({ value: amountInETH });
    // await WETH9Contract.approve(UNISWAP_ROUTER_ADDRESS, amountInETH);


    const slippageTolerance = new Percent('100', '10000'); // 1%
    const deadline = Math.floor(Date.now() / 1000) + 60 * 5;

    const swapParams = {
        tokenIn: WETH9Address,
        tokenOut: cbETHAddress,
        fee: fee,
        recipient: signer.address,
        amountIn: amountInETH,
        amountOutMinimum: 0,
        slippageTolerance: slippageTolerance,
        deadline: deadline,
        sqrtPriceLimitX96: 0,
    };

    const tx = await swapRouter.exactInputSingle.populateTransaction(swapParams);
    const receipt = await signer.sendTransaction(tx);

    console.log(`-------------------------------`)
    console.log(`Receipt: ${receipt.hash}`);
    console.log(`-------------------------------`)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
