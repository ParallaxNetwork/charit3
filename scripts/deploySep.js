// run with: npx hardhat run scripts/deploySwapV3.js --network base
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const DonationManager = await ethers.getContractFactory("DonationManagerVoting");
    const donationManager = await DonationManager.deploy(
        '0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4',
        '0x0000000000000000000000000000000000000000',
        '0x4200000000000000000000000000000000000006',
        [deployer.address, deployer.address, deployer.address] // Admins (owner acts as all admins for simplicity)
    );

    console.log("DonationManager deployed to:", await donationManager.getAddress());
    console.log("-".repeat(30));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });