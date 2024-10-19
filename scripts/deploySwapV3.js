// run with: npx hardhat run scripts/deploySwapV3.js --network base
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // Deploy SwapV3
    const SwapV3 = await ethers.getContractFactory("SwapV3");
    const swapV3 = await SwapV3.deploy(
        "0x2626664c2603336E57B271c5C0b26F421741e481", // SwapRouter address
        "0x4200000000000000000000000000000000000006",       // WETH address
        "0x2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22"       // cbETH address
    );
    const swapV3Address = await swapV3.getAddress();
    console.log("SwapV3 deployed to:", swapV3Address);
    console.log("-".repeat(30));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });