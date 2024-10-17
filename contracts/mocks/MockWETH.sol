// contracts/mocks/MockWETH.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockWETH
 * @dev A mock Wrapped ETH (WETH) contract for testing purposes.
 *      Implements basic deposit and withdraw functionalities to wrap and unwrap ETH.
 */
contract MockWETH is ERC20 {
    /**
     * @dev Constructor that gives the token its name and symbol.
     */
    constructor() ERC20("Wrapped ETH", "WETH") {}

    /**
     * @dev Allows users to deposit ETH and receive WETH at a 1:1 ratio.
     *      Equivalent to the `deposit` function in the official WETH contract.
     */
    function deposit() public payable {
        require(msg.value > 0, "Must deposit non-zero ETH amount");
        _mint(msg.sender, msg.value);
    }

    /**
     * @dev Allows users to withdraw ETH by burning their WETH at a 1:1 ratio.
     *      Equivalent to the `withdraw` function in the official WETH contract.
     * @param amount The amount of WETH to burn and withdraw as ETH.
     */
    function withdraw(uint256 amount) external {
        require(amount > 0, "Must withdraw non-zero amount");
        require(balanceOf(msg.sender) >= amount, "Insufficient WETH balance");
        _burn(msg.sender, amount);
        payable(msg.sender).transfer(amount);
    }

    /**
     * @dev Mints WETH to a specified address.
     *      This function is only intended for testing purposes to simulate liquidity.
     * @param to The address to receive the minted WETH.
     * @param amount The amount of WETH to mint.
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @dev Fallback function to accept ETH sent directly to the contract.
     *      Automatically wraps the received ETH into WETH.
     */
    receive() external payable {
        deposit();
    }
}
