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

    console.log("DonationManager deployed to:", await donationManager.getAddress());
    console.log("-".repeat(30));

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
    await donationManager.connect(voter1).voteYes(createPledgeBitmap([1, 2, 3, 4, 5], [1, 1, 1, 1, 1])); // Yes to all issues

    // Voter 2: votes all no (issues 1-5)
    await donationManager.connect(voter2).voteNo(createBitmap([1, 2, 3, 4, 5])); // No to all issues

    // Voter 3: votes in two sessions
    // First session: yes to issue 1 and 3, no to issue 2
    await donationManager.connect(voter3).voteYes(createPledgeBitmap([1, 3], [1, 1])); // Yes to issue 1 and 3
    await donationManager.connect(voter3).voteNo(createBitmap([2]));                   // No to issue 2

    // Voter 3 pledges 3 for issue 4 in the second session
    await donationManager.connect(voter3).voteYes(createPledgeBitmap([4], [3]));       // Pledge 3 for issue 4
    await donationManager.connect(voter3).voteNo(createBitmap([5]));                   // No to issue 5

    // Voter 4: votes in two sessions
    // First session: yes to issue 1, 2, 3
    await donationManager.connect(voter4).voteYes(createPledgeBitmap([1, 2, 3], [1, 1, 1])); // Yes to issues 1, 2, 3
    // Second session: no to issue 4 and 5
    await donationManager.connect(voter4).voteNo(createBitmap([4, 5]));                     // No to issues 4 and 5

    // Voter 5: votes in 1 session
    // Yes to issue 1, 2, 5, No to issue 3, 4
    await donationManager.connect(voter5).voteYes(createPledgeBitmap([1, 2, 5], [4, 2, 1])); // Pledge 4 for issue 1 and 2, Yes for issue 5
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

        // Convert the BigInt to a binary string (we don't actually need the binary string, we work with the 4-bit groups)
        for (let issueId = 1; issueId <= issueCount; issueId++) {
            const shiftAmount = (issueId - 1) * 4; // Each issue's vote is stored in 4 bits

            // Extract the 4-bit value for the current issue
            const voteValue = (yesVotesBitmap >> BigInt(shiftAmount)) & BigInt(0xF); // Extract 4 bits (0xF is 1111 in binary)

            // Convert the extracted value to a number (this will be between 0 and 11, with 11 representing 'B')
            const voteCount = Number(voteValue);
            console.log(`Voter ${voter} voted YES ${voteCount} times for issue ${issueId}`);

            if (voteCount > 0) {
                totalYesVotesPerIssue[issueId - 1] += voteCount; // Add the vote count to the issue's total
            }
        }
        console.log();
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

// Function to create a bitmap for votes (with votes being between 1 and B)
function createPledgeBitmap(issueIds, votes) {
    if (issueIds.length !== votes.length) {
        throw new Error("Issue IDs and votes length mismatch.");
    }

    let bitmap = BigInt(0); // Initialize bitmap as BigInt to represent the full uint256 bitmap

    issueIds.forEach((issueId, index) => {
        const voteValue = votes[index];

        // Ensure the vote/pledge value is valid (between 1 and B, hexadecimal 0x1 to 0xB)
        if (voteValue < 1 || voteValue > 11) {
            throw new Error(`Vote value for issue ${issueId} is out of range (1 to B).`);
        }

        // Shift and OR the vote value in the correct position (use 4 bits for each vote)
        bitmap |= BigInt(voteValue) << BigInt((issueId - 1) * 4); // Shift by 4 bits per issue
    });

    return bitmap; // Return the bitmap representing the votes/pledges
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
