// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interface/IV3SwapRouter.sol";


interface IWETH9 is IERC20 {
    function deposit() external payable;
    function withdraw(uint256) external;
}

contract SwapV3 is Ownable {
    // Uniswap V3 SwapRouter
    IV3SwapRouter public immutable swapRouter;

    // WETH and cbETH token interfaces
    IWETH9 public immutable WETH;
    IERC20 public immutable cbETH;

    // Uniswap pool fee (e.g., 3000 for 0.3%)
    uint24 public constant poolFee = 3000;

    // Events
    event SwappedETHToCbETH(address indexed user, uint256 amountIn, uint256 amountOut);
    event SwappedCbETHToETH(address indexed user, uint256 amountIn, uint256 amountOut);
    event Withdrawn(address indexed owner, address token, uint256 amount);

    /**
     * @notice Constructor to initialize the contract with necessary addresses.
     * @param _swapRouter Address of the Uniswap V3 SwapRouter.
     * @param _weth Address of the WETH token.
     * @param _cbETH Address of the cbETH token.
     */
    constructor(
        address _swapRouter,
        address _weth,
        address _cbETH
    ) Ownable(msg.sender) {
        require(_swapRouter != address(0), "Invalid SwapRouter address");
        require(_weth != address(0), "Invalid WETH address");
        require(_cbETH != address(0), "Invalid cbETH address");

        swapRouter = IV3SwapRouter(_swapRouter);
        WETH = IWETH9(_weth);
        cbETH = IERC20(_cbETH);

        // Approve the SwapRouter to spend WETH and cbETH indefinitely
        WETH.approve(address(swapRouter), type(uint256).max);
        cbETH.approve(address(swapRouter), type(uint256).max);
    }

    /**
     * @notice Swap ETH to cbETH.
     * @param amountOutMinimum The minimum amount of cbETH to receive.
     */
    function swapETHToCbETH(uint256 amountOutMinimum) external payable {
        require(msg.value > 0, "Must pass non-zero ETH amount");

        // Define swap parameters
        IV3SwapRouter.ExactInputSingleParams memory params =
            IV3SwapRouter.ExactInputSingleParams({
                tokenIn: address(WETH),
                tokenOut: address(cbETH),
                fee: poolFee,
                recipient: msg.sender,
                amountIn: msg.value,
                amountOutMinimum: amountOutMinimum,
                sqrtPriceLimitX96: 0 // No price limit
            });

        // Execute the swap
        uint256 amountOut = swapRouter.exactInputSingle{value: msg.value}(params);

        require(amountOut >= amountOutMinimum, "Insufficient output amount");

        emit SwappedETHToCbETH(msg.sender, msg.value, amountOut);
    }


    /**
     * @notice Swap cbETH to ETH. Sender needs to approve.
     * @param amountIn The amount of cbETH to swap.
     * @param amountOutMinimum The minimum amount of ETH to receive.
     */
    function swapCbETHToETH(uint256 amountIn, uint256 amountOutMinimum) external {
        require(amountIn > 0, "Must pass non-zero cbETH amount");

        // Transfer cbETH from sender to this contract
        bool success = cbETH.transferFrom(msg.sender, address(this), amountIn);
        require(success, "Transfer of cbETH failed");

        // Define swap parameters to swap cbETH to WETH
        IV3SwapRouter.ExactInputSingleParams memory params =
            IV3SwapRouter.ExactInputSingleParams({
                tokenIn: address(cbETH),
                tokenOut: address(WETH),
                fee: poolFee,
                recipient: address(this), // Receive WETH in this contract
                amountIn: amountIn,
                amountOutMinimum: amountOutMinimum,
                sqrtPriceLimitX96: 0 // No price limit
            });

        // Execute the swap from cbETH to WETH
        uint256 amountOut = swapRouter.exactInputSingle(params);

        require(amountOut >= amountOutMinimum, "Insufficient output amount");
        // Unwrap WETH to ETH
        WETH.withdraw(amountOut);

        // Transfer ETH to the user
        (bool sent, ) = msg.sender.call{value: amountOut}("");
        require(sent, "Failed to send ETH");

        emit SwappedCbETHToETH(msg.sender, amountIn, amountOut);
    }


    /**
     * @notice Withdraw tokens from the contract. Only the owner can call this.
     * @param token The address of the token to withdraw.
     * @param amount The amount of the token to withdraw.
     */
    function withdraw(address token, uint256 amount) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Must withdraw non-zero amount");

        bool success = IERC20(token).transfer(owner(), amount);
        require(success, "Token transfer failed");

        emit Withdrawn(owner(), token, amount);
    }

    function withdrawETH() external onlyOwner {
        require(address(this).balance > 0, "No ETH to withdraw");
        payable(owner()).transfer(address(this).balance);
    }

    /**
     * @notice Fallback function to accept ETH.
     */
    receive() external payable {}
}
