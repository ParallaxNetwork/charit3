// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockCbETH is ERC20 {
    constructor() ERC20("Coinbase ETH", "cbETH") {}

    // Function to mint tokens for testing
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
