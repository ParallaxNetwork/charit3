// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { ISwapRouter } from "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import { IQuoter } from "@uniswap/v3-periphery/contracts/interfaces/IQuoter.sol";
import { IWETH9 } from "@uniswap/v3-periphery/contracts/interfaces/external/IWETH9.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DonationManager is Ownable {
    ISwapRouter public swapRouter = ISwapRouter(0x2626664c2603336E57B271c5C0b26F421741e481);
    IQuoter public quoter = IQuoter(0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a);

    address public constant cbETH = 0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22;
    address public constant WETH9 = 0x4200000000000000000000000000000000000006;

    event SwappedToCbETH(address sender, uint256 cbETHAmount);
    event SwappedToETH(address sender, uint256 cbETHAmount, uint256 ETHAmount);

    receive() external payable {}

    function depositToCbETH() external payable {
        require(msg.value > 0, "ETH amount must be greater than 0");

        uint256 estimatedAmountOut = getEstimatedCbETHForETH(msg.value);
        uint256 amountOutMinimum = estimatedAmountOut * 99 / 100;

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: WETH9,
            tokenOut: cbETH,
            fee: 500,
            recipient: msg.sender,
            deadline: block.timestamp + 15,
            amountIn: msg.value,
            amountOutMinimum: amountOutMinimum,
            sqrtPriceLimitX96: 0
        });

        uint256 amountOut = swapRouter.exactInputSingle{value: msg.value}(params);
        emit SwappedToCbETH(msg.sender, amountOut);
    }

    function getEstimatedCbETHForETH(uint256 amountIn) public returns (uint256) {
        uint256 estimatedAmountOut = quoter.quoteExactInputSingle(
            WETH9,
            cbETH,
            500,
            amountIn,
            0
        );

        return estimatedAmountOut;
    }

    function getEstimatedETHForCbETH(uint256 amountIn) public returns (uint256) {
        uint256 estimatedAmountOut = quoter.quoteExactInputSingle(
            cbETH,
            WETH9,
            500,
            amountIn,
            0
        );

        return estimatedAmountOut;
    }

    function withdrawToETH(uint256 cbETHAmount) external {
        require(cbETHAmount > 0, "Amount must be greater than 0");
        require(IERC20(cbETH).balanceOf(msg.sender) >= cbETHAmount, "Insufficient cbETH balance");

        IERC20(cbETH).transferFrom(msg.sender, address(this), cbETHAmount);
        IERC20(cbETH).approve(address(swapRouter), cbETHAmount);

        uint256 estimatedETH = getEstimatedETHForCbETH(cbETHAmount);

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: cbETH,
            tokenOut: WETH9,
            fee: 500,
            recipient: address(this),
            deadline: block.timestamp + 15,
            amountIn: cbETHAmount,
            amountOutMinimum: estimatedETH * 99 / 100,
            sqrtPriceLimitX96: 0
        });

        uint256 amountOut = swapRouter.exactInputSingle(params);

        IWETH9(WETH9).withdraw(amountOut);

        (bool success, ) = msg.sender.call{value: amountOut}("");
        require(success, "ETH transfer failed");

        emit SwappedToETH(msg.sender, cbETHAmount, amountOut);
    }
}
