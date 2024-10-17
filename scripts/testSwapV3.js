// scripts/testSwapV3.js

const { ethers } = require("hardhat");

async function main() {
    const [deployer, user] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);
    console.log("User address:", user.address);
    console.log("-".repeat(30));

    // Deploy MockWETH
    const MockWETH = await ethers.getContractFactory("MockWETH");
    const mockWETH = await MockWETH.deploy();
    const mockWETHAddress = await mockWETH.getAddress();
    console.log("MockWETH deployed to:", mockWETHAddress);
    console.log("-".repeat(30));

    // Deploy MockCbETH
    const MockCbETH = await ethers.getContractFactory("MockCbETH");
    const mockCbETH = await MockCbETH.deploy();
    const mockCbETHAddress = await mockCbETH.getAddress();
    console.log("MockCbETH deployed to:", mockCbETHAddress);
    console.log("-".repeat(30));

    // Deploy MockSwapRouter
    const MockSwapRouter = await ethers.getContractFactory("MockSwapRouter");
    const mockSwapRouter = await MockSwapRouter.deploy();
    const mockSwapRouterAddress = await mockSwapRouter.getAddress();
    console.log("MockSwapRouter deployed to:", mockSwapRouterAddress);
    console.log("-".repeat(30));

    // Deploy MockQuoter
    const MockQuoter = await ethers.getContractFactory("MockQuoter");
    const mockQuoter = await MockQuoter.deploy();
    const mockQuoterAddress = await mockQuoter.getAddress();
    console.log("MockQuoter deployed to:", mockQuoterAddress);
    console.log("-".repeat(30));

    // Deploy SwapV3
    const SwapV3 = await ethers.getContractFactory("SwapV3");
    const swapV3 = await SwapV3.deploy(
        mockSwapRouterAddress, // SwapRouter address
        mockQuoterAddress,     // Quoter address
        mockWETHAddress,       // WETH address
        mockCbETHAddress       // cbETH address
    );
    const swapV3Address = await swapV3.getAddress();
    console.log("SwapV3 deployed to:", swapV3Address);
    console.log("-".repeat(30));

    // Mint WETH and cbETH to SwapV3 contract to simulate liquidity
    const mintAmount = ethers.parseEther("1000"); // 1000 tokens

    const mintWETHTx = await mockWETH.mint(swapV3Address, mintAmount);
    console.log(`Minted ${ethers.formatEther(mintAmount)} WETH to SwapV3`);

    const mintCbETHTx = await mockCbETH.mint(swapV3Address, mintAmount);
    console.log(`Minted ${ethers.formatEther(mintAmount)} cbETH to SwapV3`);
    console.log("-".repeat(30));

    // Mint cbETH to the user for swapping back to ETH
    const userMintCbETHAmount = ethers.parseEther("100"); // 100 cbETH
    const userMintCbETHTx = await mockCbETH.mint(user.address, userMintCbETHAmount);
    console.log(`Minted ${ethers.formatEther(userMintCbETHAmount)} cbETH to user`);
    console.log("-".repeat(30));

    // Mint WETH to MockSwapRouter
    const mintWethToRouterTx = await mockWETH.mint(mockSwapRouterAddress, mintAmount);
    await mintWethToRouterTx.wait();
    console.log(`Minted 1000 WETH to MockSwapRouter`);
    console.log("-".repeat(30));

    // Mint cbETH to MockSwapRouter
    const mintCbETHToRouterTx = await mockCbETH.mint(mockSwapRouterAddress, mintAmount);
    await mintCbETHToRouterTx.wait();
    console.log(`Minted 1000 cbETH to MockSwapRouter`);
    console.log("-".repeat(30));

    // Send ETH to MockWETH
    await deployer.sendTransaction({
        to: mockWETHAddress,
        value: mintAmount
    });

    // User wraps ETH to WETH by sending ETH to MockWETH
    const userWrapEthAmount = ethers.parseEther("10"); // 10 ETH
    const userWrapEthTx = await user.sendTransaction({
        to: mockWETHAddress,
        value: userWrapEthAmount,
    });
    console.log(`User wrapped ${ethers.formatEther(userWrapEthAmount)} ETH to WETH`);
    console.log("-".repeat(30));

    // Connect user to mock contracts
    const userWETH = mockWETH.connect(user);
    const userCbETH = mockCbETH.connect(user);

    // Approve SwapV3 to spend user's WETH and cbETH
    const userApproveWETHTx = await userWETH.approve(swapV3Address, ethers.MaxUint256);
    console.log("User approved SwapV3 to spend WETH");

    const userApproveCbETHTx = await userCbETH.approve(swapV3Address, ethers.MaxUint256);
    console.log("User approved SwapV3 to spend cbETH");
    console.log("-".repeat(30));

    // -----------------------------
    // Swap 1: ETH to cbETH
    // -----------------------------
    const swap1EthAmount = ethers.parseEther("1"); // 1 ETH
    console.log("\n--- Swap 1: ETH to cbETH ---");

    const swap1Tx = await swapV3.connect(user).swapETHToCbETH(0, { value: swap1EthAmount });
    console.log(`Swapped ${ethers.formatEther(swap1EthAmount)} ETH to cbETH`);

    // Check user's cbETH balance
    const userCbETHBalance1 = await mockCbETH.balanceOf(user.address);
    console.log(`User cbETH Balance: ${ethers.formatEther(userCbETHBalance1)} cbETH`);
    console.log("-".repeat(30));

    // -----------------------------
    // Swap 2: WETH to cbETH
    // -----------------------------
    const swap2WethAmount = ethers.parseEther("2"); // 2 WETH
    console.log("\n--- Swap 2: WETH to cbETH ---");

    const swap2Tx = await swapV3.connect(user).swapWETHToCbETH(
        swap2WethAmount,
        0
    );
    console.log(`Swapped ${ethers.formatEther(swap2WethAmount)} WETH to cbETH`);

    // Check user's cbETH balance
    const userCbETHBalance2 = await mockCbETH.balanceOf(user.address);
    console.log(`User cbETH Balance: ${ethers.formatEther(userCbETHBalance2)} cbETH`);
    console.log("-".repeat(30));

    // -----------------------------
    // Swap 3: cbETH to ETH
    // -----------------------------
    const swap3CbETHAmount = ethers.parseEther("50"); // 50 cbETH
    console.log("\n--- Swap 3: cbETH to ETH ---");

    const swap3Tx = await swapV3.connect(user).swapCbETHToETH(
        swap3CbETHAmount,
        0
    );
    console.log(`Swapped ${ethers.formatEther(swap3CbETHAmount)} cbETH to ETH`);

    // Check user's ETH balance
    const userEthBalance = await ethers.provider.getBalance(user.address);
    console.log(`User ETH Balance: ${ethers.formatEther(userEthBalance)} ETH`);
    console.log("-".repeat(30));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error in testSwapV3.js:", error);
        process.exit(1);
    });
