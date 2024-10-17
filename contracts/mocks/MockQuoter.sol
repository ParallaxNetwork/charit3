// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

interface IQuoter {
    function quoteExactInputSingle(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountIn,
        uint160 sqrtPriceLimitX96
    ) external returns (uint256 amountOut);
}

contract MockQuoter is IQuoter {
    // Simulate quoteExactInputSingle by returning the same amount (1:1 ratio)
    function quoteExactInputSingle(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountIn,
        uint160 sqrtPriceLimitX96
    ) external pure override returns (uint256 amountOut) {
        return amountIn; // 1:1 rate for testing
    }
}
