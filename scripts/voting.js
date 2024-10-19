const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
    // Deploy the DonationManager contract
    const [owner, voter1, voter2, voter3, voter4, voter5, issue1Creator, issue2Creator, issue3Creator, issue4Creator, issue5Creator] = await ethers.getSigners();

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

    const DonationManager = await ethers.getContractFactory("DonationManager");
    const donationManager = await DonationManager.deploy(
        mockSwapRouterAddress,
        mockCbETHAddress,
        mockWETHAddress,
        [owner.address, owner.address, owner.address] // Admins (owner acts as all admins for simplicity)
    );
    const donationManagerAddress = await donationManager.getAddress();

    // THIS MINTING ONLY FOR MOCKING
    const mintAmount = ethers.parseEther("1000"); // 1000 tokens

    // Mint WETH to MockSwapRouter
    const mintWethToDonationMgrTx = await mockWETH.mint(donationManagerAddress, mintAmount);
    await mintWethToDonationMgrTx.wait();
    console.log(`Minted 1000 WETH to DonationManager`);

    // Mint WETH to MockSwapRouter
    const mintWethToRouterTx = await mockWETH.mint(mockSwapRouterAddress, mintAmount);
    await mintWethToRouterTx.wait();
    console.log(`Minted 1000 WETH to MockSwapRouter`);

    // Mint cbETH to MockSwapRouter
    const mintCbETHToRouterTx = await mockCbETH.mint(mockSwapRouterAddress, mintAmount);
    await mintCbETHToRouterTx.wait();
    console.log(`Minted 1000 cbETH to MockSwapRouter`);
    console.log("-".repeat(30));



    console.log("DonationManager deployed to:", await donationManager.getAddress());
    console.log("-".repeat(30));


    // Create a round (start immediately, ends in 2 days)
    const currentTimestamp = await time.latest();
    const issueRegisStart = currentTimestamp;
    const votingStart = issueRegisStart + 10;
    const votingEnd = votingStart + 2 * 24 * 60 * 60; // 2 days later

    await donationManager.createRound(issueRegisStart, votingStart, votingEnd);
    console.log("Round created number:", await donationManager.roundId());

    // Create 5 issues
    await donationManager.connect(issue1Creator).createIssue(voter1.address);
    await donationManager.connect(issue2Creator).createIssue(voter2.address);
    await donationManager.connect(issue3Creator).createIssue(voter3.address);
    await donationManager.connect(issue4Creator).createIssue(voter4.address);
    await donationManager.connect(issue5Creator).createIssue(voter5.address);

    console.log("Issues created number:", await donationManager.issueId());

    const firstIssueIdForTheRound = await donationManager.roundStartIssueId(1);
    console.log("First issue id for the round:", firstIssueIdForTheRound);

    // Fast forward to the start of the voting period
    await time.increase(10);

    console.log("-".repeat(30));
    console.log("Voters stake");
    console.log("-".repeat(30));

    const ETHswapAmount = '0.03';
    // in mainnet should get quote to estimate min amount out
    // const quoteETHToCbETHExactIn = await getQuoteETHToCbETHExactIn(ETHswapAmount, mockWETHAddress, mockCbETHAddress, mockQuoter);
    await donationManager.connect(voter1).stake(0, {
        value: ethers.parseEther(ETHswapAmount)
    });
    await donationManager.connect(voter2).stake(0, {
        value: ethers.parseEther(ETHswapAmount)
    });
    await donationManager.connect(voter3).stake(0, {
        value: ethers.parseEther(ETHswapAmount)
    });
    await donationManager.connect(voter4).stake(0, {
        value: ethers.parseEther(ETHswapAmount)
    });
    await donationManager.connect(voter5).stake(0, {
        value: ethers.parseEther(ETHswapAmount)
    });

    console.log("-".repeat(30));
    console.log("Voting period started");
    console.log("-".repeat(30));

    // Voter 1: votes all yes (issues 1-5)
    await donationManager.connect(voter1).voteYes(createBitmap([1, 2, 3, 4, 5])); // Yes to All

    // Voter 2: votes all no (issues 1-5)
    await donationManager.connect(voter2).voteNo(createBitmap([1, 2, 3, 4, 5])); // No to All

    // Voter 3: votes in two sessions
    // First session: yes to issue 1, 3, no to issue 2
    await donationManager.connect(voter3).voteYes(createBitmap([1, 4])); // Yes to 1 and 3
    await donationManager.connect(voter3).voteNo(createBitmap([2]));     // No to 2


    const unvotedIssues = await getUnvotedIssues(await donationManager.userVotesBitmap(voter3.address, 1), 1, 5);
    console.log(`User ${voter3.address} has note voted on issues: ${unvotedIssues}`);

    // Second session: yes to issue 4, no to issue 5
    await donationManager.connect(voter3).voteYes(createBitmap([3])); // Yes to 4
    await donationManager.connect(voter3).voteNo(createBitmap([5]));  // No to 5

    // Voter 4: votes in two sessions
    // First session: yes to 1, 2, 3
    await donationManager.connect(voter4).voteYes(createBitmap([1, 2, 3]));
    // Second session: no to 4, 5
    await donationManager.connect(voter4).voteNo(createBitmap([4, 5]));

    // Voter 5: votes in 1 session
    // Yes to 1, 2, 5, No to 3, 4
    await donationManager.connect(voter5).voteYes(createBitmap([1, 2, 5]));
    await donationManager.connect(voter5).voteNo(createBitmap([3, 4]));

    console.log("-".repeat(30));
    console.log("Voting completed");


    // Fast forward to the end of the voting period
    await time.increase(2 * 24 * 60 * 60 + 1); // Forward 2 days

    // !!!
    // Filter YesVoted events between the start and end time of voting (cannot be used in local)
    // const yesVoteEvents = await donationManager.queryFilter(
    //     donationManager.filters.YesVoted(),
    //     votingStart,
    //     votingEnd
    // );

    // Extract unique addresses from YesVoted events
    // const uniqueVoters = new Set();
    // yesVoteEvents.forEach(event => {
    //     uniqueVoters.add(event.args.voter); // Add each voter to the Set
    // });


    // local set
    const uniqueVoters = new Set();

    // Add voter addresses directly to the set
    uniqueVoters.add(voter1.address);
    uniqueVoters.add(voter2.address);
    uniqueVoters.add(voter3.address);
    uniqueVoters.add(voter4.address);
    uniqueVoters.add(voter5.address);

    const roundId = await donationManager.roundId(); // Example round ID
    const issueCount = Number(await donationManager.issueId() + BigInt(1) - await donationManager.roundStartIssueId(roundId));

    console.log("-".repeat(30));
    console.log(`Issue count for round ${roundId} is ${issueCount}`);
    const totalYesVotesPerIssue = new Array(issueCount).fill(0); // Initialize array to count YES votes per issue

    for (const voter of uniqueVoters) {
        const yesVotesBitmap = await donationManager.userYesVotes(voter, roundId);

        // Convert the BigInt to a binary string
        const binaryString = (yesVotesBitmap.toString(2)).padStart(issueCount, '0'); // Ensure it's padded to the correct length
        // console.log(binaryString);

        // Loop through each issue and check the corresponding bit in the binary string
        for (let issueId = 1; issueId <= issueCount; issueId++) {
            const bitIndex = issueCount - issueId; // Get the corresponding index in the binary string

            // If the bitIndex is out of bounds, continue to the next iteration
            if (bitIndex < 0 || bitIndex >= binaryString.length) {
                continue;
            }

            // Check if the bit is set to '1' (meaning a YES vote)
            if (binaryString[bitIndex] === '1') {
                totalYesVotesPerIssue[issueId - 1] += 1; // Increment YES vote count for the issueId
            }
        }
    }

    // Log total YES votes per issue ID
    for (let issueId = 1; issueId <= issueCount; issueId++) {
        console.log(`Total YES votes for issue ${issueId}: ${totalYesVotesPerIssue[issueId - 1]}`);
    }

    // console log - for 30 times
    console.log("-".repeat(30));
    console.log("Unique voters who voted YES:", Array.from(uniqueVoters));
}

// Helper function to create a bitmap from an array of issueIds (uint256)
function createBitmap(issueIds) {
    let bitmap = BigInt(0); // Start with a uint256 (BigInt)
    issueIds.forEach(issueId => {
        bitmap |= BigInt(1) << BigInt(issueId - 1); // Set the bit for the given issueId
    });
    return bitmap;
}

async function getUnvotedIssues(votesBitmap, startIssueId, issueCount) {
    const binaryString = votesBitmap.toString(2).padStart(issueCount, '0'); // Convert bitmap to binary and pad to the number of issues
    const unvotedIssues = [];

    // Loop through the binary string and check for unvoted issues (where bit is '0')
    for (let i = 0; i < issueCount; i++) {
        const bitIndex = issueCount - 1 - i; // Start from the end of the binary string
        if (binaryString[bitIndex] === '0') {
            unvotedIssues.push(startIssueId + i); // Add the unvoted issue ID
        }
    }

    return unvotedIssues;
}

async function getQuoteETHToCbETHExactIn(amountIn, mockWETHAddress, mockCbETHAddress, mockQuoter) {
    const params = {
        tokenIn: mockWETHAddress,
        tokenOut: mockCbETHAddress,
        fee: 3000,
        amountIn: ethers.parseEther(amountIn),
        sqrtPriceLimitX96: 0
    };
    return await mockQuoter.quoteExactInputSingle.staticCall(params);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
