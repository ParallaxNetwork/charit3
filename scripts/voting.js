const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
    // Deploy the DonationManager contract
    const [owner, voter1, voter2, voter3, voter4, voter5, issue1Creator, issue2Creator, issue3Creator, issue4Creator, issue5Creator] = await ethers.getSigners();

    const DonationManager = await ethers.getContractFactory("DonationManager");
    const donationManager = await DonationManager.deploy(
        owner.address, // Swap router (dummy address for testing)
        owner.address, // Quoter (dummy address for testing)
        [owner.address, owner.address, owner.address] // Admins (owner acts as all admins for simplicity)
    );

    console.log("DonationManager deployed to:", await donationManager.getAddress());

    // Create a round (start immediately, ends in 2 days)
    const currentTimestamp = await time.latest();
    const issueRegisStart = currentTimestamp;
    const votingStart = issueRegisStart + 10;
    const votingEnd = votingStart + 2 * 24 * 60 * 60; // 2 days later

    await donationManager.createRound(issueRegisStart, votingStart, votingEnd);
    console.log("Round created");

    // Create 5 issues
    await donationManager.connect(issue1Creator).createIssue(voter1.address);
    await donationManager.connect(issue2Creator).createIssue(voter2.address);
    await donationManager.connect(issue3Creator).createIssue(voter3.address);
    await donationManager.connect(issue4Creator).createIssue(voter4.address);
    await donationManager.connect(issue5Creator).createIssue(voter5.address);

    console.log("5 issues created");

    // Fast forward to the start of the voting period
    await time.increase(10);

    // Voter 1: votes all yes (issues 1-5)
    await donationManager.connect(voter1).voteYes(createBitmap([1, 2, 3, 4, 5])); // Yes to All

    // Voter 2: votes all no (issues 1-5)
    await donationManager.connect(voter2).voteNo(createBitmap([1, 2, 3, 4, 5])); // No to All

    // Voter 3: votes in two sessions
    // First session: yes to issue 1, 3, no to issue 2
    await donationManager.connect(voter3).voteYes(createBitmap([1, 3])); // Yes to 1 and 3
    await donationManager.connect(voter3).voteNo(createBitmap([2]));     // No to 2
    // Second session: yes to issue 4, no to issue 5
    await donationManager.connect(voter3).voteYes(createBitmap([4])); // Yes to 4
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

    console.log("Voting completed");

    // Fast forward to the end of the voting period
    await time.increase(2 * 24 * 60 * 60 + 1); // Forward 2 days

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

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
