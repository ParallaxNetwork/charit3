// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ISwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);
}

contract MockSwapRouter is ISwapRouter {
    // Simulate swapExactInputSingle by transferring tokens directly at 1:1 ratio
    function exactInputSingle(ExactInputSingleParams calldata params) external payable override returns (uint256 amountOut) {
        require(block.timestamp <= params.deadline, "Transaction expired");
        require(params.amountIn > 0, "AmountIn must be greater than 0");

        // Transfer tokenIn from sender to router
        IERC20(params.tokenIn).transferFrom(msg.sender, address(this), params.amountIn);

        // Transfer tokenOut to recipient
        IERC20(params.tokenOut).transfer(params.recipient, params.amountIn);

        return params.amountIn; // 1:1 swap rate for testing
    }
}
