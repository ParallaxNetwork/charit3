// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

// Import OpenZeppelin's Ownable for access control
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

// Import Uniswap V3 Interfaces
import {ISwapRouter} from "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import {IQuoter} from "@uniswap/v3-periphery/contracts/interfaces/IQuoter.sol";
import {IUniswapV3Pool} from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";

// Import ERC20 Interface
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

interface IWETH9 is IERC20 {
    function deposit() external payable;
    function withdraw(uint256) external;
}

contract SwapV3 is Ownable {
    // Uniswap V3 SwapRouter
    ISwapRouter public immutable swapRouter;

    // Uniswap V3 Quoter for price estimates
    IQuoter public immutable quoter;

    // WETH and cbETH token interfaces
    IWETH9 public immutable WETH;
    IERC20 public immutable cbETH;

    // Uniswap pool fee (e.g., 3000 for 0.3%)
    uint24 public constant poolFee = 3000;

    // Events
    event SwappedETHToCbETH(address indexed user, uint256 amountIn, uint256 amountOut);
    event SwappedWETHToCbETH(address indexed user, uint256 amountIn, uint256 amountOut);
    event SwappedCbETHToETH(address indexed user, uint256 amountIn, uint256 amountOut);
    event Withdrawn(address indexed owner, address token, uint256 amount);

    /**
     * @notice Constructor to initialize the contract with necessary addresses.
     * @param _swapRouter Address of the Uniswap V3 SwapRouter.
     * @param _quoter Address of the Uniswap V3 Quoter.
     * @param _weth Address of the WETH token.
     * @param _cbETH Address of the cbETH token.
     */
    constructor(
        address _swapRouter,
        address _quoter,
        address _weth,
        address _cbETH
    ) Ownable(msg.sender) {
        require(_swapRouter != address(0), "Invalid SwapRouter address");
        require(_quoter != address(0), "Invalid Quoter address");
        require(_weth != address(0), "Invalid WETH address");
        require(_cbETH != address(0), "Invalid cbETH address");

        swapRouter = ISwapRouter(_swapRouter);
        quoter = IQuoter(_quoter);
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

        // Wrap ETH to WETH
        WETH.deposit{value: msg.value}();

        // Define swap parameters
        ISwapRouter.ExactInputSingleParams memory params =
            ISwapRouter.ExactInputSingleParams({
                tokenIn: address(WETH),
                tokenOut: address(cbETH),
                fee: poolFee,
                recipient: msg.sender,
                deadline: block.timestamp + 300, // 5 minutes from now
                amountIn: msg.value,
                amountOutMinimum: amountOutMinimum,
                sqrtPriceLimitX96: 0 // No price limit
            });

        // Execute the swap
        uint256 amountOut = swapRouter.exactInputSingle(params);

        require(amountOut >= amountOutMinimum, "Insufficient output amount");

        emit SwappedETHToCbETH(msg.sender, msg.value, amountOut);
    }

    /**
     * @notice Swap WETH to cbETH.
     * @param amountIn The amount of WETH to swap.
     * @param amountOutMinimum The minimum amount of cbETH to receive.
     */
    function swapWETHToCbETH(uint256 amountIn, uint256 amountOutMinimum) external {
        require(amountIn > 0, "Must pass non-zero WETH amount");

        // Transfer WETH from sender to this contract
        bool success = WETH.transferFrom(msg.sender, address(this), amountIn);
        require(success, "Transfer of WETH failed");

        // Define swap parameters
        ISwapRouter.ExactInputSingleParams memory params =
            ISwapRouter.ExactInputSingleParams({
                tokenIn: address(WETH),
                tokenOut: address(cbETH),
                fee: poolFee,
                recipient: msg.sender,
                deadline: block.timestamp + 300, // 5 minutes from now
                amountIn: amountIn,
                amountOutMinimum: amountOutMinimum,
                sqrtPriceLimitX96: 0 // No price limit
            });

        // Execute the swap
        uint256 amountOut = swapRouter.exactInputSingle(params);

        require(amountOut >= amountOutMinimum, "Insufficient output amount");

        emit SwappedWETHToCbETH(msg.sender, amountIn, amountOut);
    }

    /**
     * @notice Swap cbETH to ETH.
     * @param amountIn The amount of cbETH to swap.
     * @param amountOutMinimum The minimum amount of ETH to receive.
     */
    function swapCbETHToETH(uint256 amountIn, uint256 amountOutMinimum) external {
        require(amountIn > 0, "Must pass non-zero cbETH amount");

        // Transfer cbETH from sender to this contract
        bool success = cbETH.transferFrom(msg.sender, address(this), amountIn);
        require(success, "Transfer of cbETH failed");

        // Define swap parameters to swap cbETH to WETH
        ISwapRouter.ExactInputSingleParams memory params =
            ISwapRouter.ExactInputSingleParams({
                tokenIn: address(cbETH),
                tokenOut: address(WETH),
                fee: poolFee,
                recipient: address(this), // Receive WETH in this contract
                deadline: block.timestamp + 300, // 5 minutes from now
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
     * @notice Get a quote for swapping ETH to cbETH using the Quoter.
     * @param ethAmount The amount of ETH to swap.
     * @return cbETHAmount The estimated amount of cbETH to receive.
     */
    function getETHToCbETHQuote(uint256 ethAmount) external returns (uint256 cbETHAmount) {
        require(ethAmount > 0, "Must pass non-zero ETH amount");

        // Simulate wrapping ETH to WETH
        // Note: The Quoter does not require actual token balances
        cbETHAmount = quoter.quoteExactInputSingle(
            address(WETH),
            address(cbETH),
            poolFee,
            ethAmount,
            0
        );
    }

    /**
     * @notice Get a quote for swapping WETH to cbETH using the Quoter.
     * @param wethAmount The amount of WETH to swap.
     * @return cbETHAmount The estimated amount of cbETH to receive.
     */
    function getWETHToCbETHQuote(uint256 wethAmount) external returns (uint256 cbETHAmount) {
        require(wethAmount > 0, "Must pass non-zero WETH amount");

        cbETHAmount = quoter.quoteExactInputSingle(
            address(WETH),
            address(cbETH),
            poolFee,
            wethAmount,
            0
        );
    }

    /**
     * @notice Get a quote for swapping cbETH to ETH using the Quoter.
     * @param cbETHAmount The amount of cbETH to swap.
     * @return ethAmount The estimated amount of ETH to receive.
     */
    function getCbETHToETHQuote(uint256 cbETHAmount) external returns (uint256 ethAmount) {
        require(cbETHAmount > 0, "Must pass non-zero cbETH amount");

        ethAmount = quoter.quoteExactInputSingle(
            address(cbETH),
            address(WETH),
            poolFee,
            cbETHAmount,
            0
        );
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

    /**
     * @notice Fallback function to accept ETH.
     */
    receive() external payable {}
}
