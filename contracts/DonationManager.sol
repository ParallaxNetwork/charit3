// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ISwapRouter} from "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract DonationManager is Ownable {
    ISwapRouter public swapRouter;
    IERC20 public cbETH;

    address public cbETHToken;
    address public WETH9;

    address[3] public adminSigners;
    uint256 public totalDepositedETH;
    uint256 public initialETHDeposited;

    mapping(address => uint256) public deposits;
    mapping(uint256 issueId => Allocation) public allocations;
    
    Withdrawal[] public withdrawals;

    uint256 roundId;
    uint256 issueId;
    mapping(uint256 => Round) public rounds;
    mapping(uint256 => Issue) public issues;

    // Mapping of user to roundId to a bitmap representing all the issues they've voted YES on
    mapping(address => mapping(uint256 => uint256)) public userYesVotes;
    // Mapping of user to roundId to a bitmap representing all the issues they've voted on (YES or NO)
    mapping(address => mapping(uint256 => uint256)) public userVotesBitmap;
    // Mapping to track the starting issueId for each round
    mapping(uint256 => uint256) public roundStartIssueId;

    error NotAdmin();
    error RoundAlreadyRunning();
    error InvalidRoundTiming();
    error VotingAlreadyStarted();

    // Event to emit when a YES vote is cast
    event YesVoted(
        address indexed voter,
        uint256 indexed roundId,
        uint256 bitmap
    );

    // Event to emit when a NO vote is set
    event NoVoted(
        address indexed voter,
        uint256 indexed roundId,
        uint256 bitmap
    );

    struct Allocation {
        uint256 issueId;
        uint256 amount;
    }

    struct Issue {
        uint256 roundId;
        uint256 issueID;
        address receiver;
        uint256 issueDate;
        bool isActive;
    }

    struct Round {
        uint256 issueRegisStart; // When the issue registration period starts
        uint256 votingStart; // When the voting period starts, registration closed
        uint256 votingEnd; // When the voting period ends
        bool isActive;
    }

    // To handle admin cbETH withdrawals
    struct Withdrawal {
        uint256 amount;
        address requester;
        bool approved;
    }

    mapping(uint256 => mapping(address => bool)) public adminApprovals; // requestId => admin address => approval

    event Deposited(address sender, uint256 ethAmount);
    event SwappedToCbETH(address sender, uint256 cbETHAmount);
    event IssueCreated(uint256 roundId, uint256 issueID);
    event IssueDeactivated(uint256 roundId);
    event RoundOngoing(uint256 roundId);

    constructor(
        address _swapRouter,
        address _cbETHToken,
        address _WETH9,
        address[3] memory _adminSigners
    ) {
        swapRouter = ISwapRouter(_swapRouter);
        cbETHToken = _cbETHToken;
        cbETH = IERC20(_cbETHToken);
        WETH9 = _WETH9;
        adminSigners = _adminSigners;
    }

    // Deposit ETH and store under the sender's balance
    receive() external payable {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        deposits[msg.sender] += msg.value;
        totalDepositedETH += msg.value;
       swapToCbETH{value: msg.value}();
        emit Deposited(msg.sender, msg.value);
    }

    // Swap the sender's deposited ETH for cbETH
    function swapToCbETH() public payable {
        // require(
        //     deposits[msg.sender] >= amountIn,
        //     "Insufficient deposited balance"
        // );

        // // Update sender's ETH balance
        // deposits[msg.sender] -= amountIn;

        // // Uniswap swap: ETH -> cbETH
        // ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
        //     .ExactInputSingleParams({
        //         tokenIn: WETH9,
        //         tokenOut: cbETHToken,
        //         fee: 3000,
        //         recipient: msg.sender,
        //         deadline: block.timestamp + 15,
        //         amountIn: amountIn,
        //         amountOutMinimum: 0,
        //         sqrtPriceLimitX96: 0
        //     });

        // // Execute the swap
        // uint256 amountOut = swapRouter.exactInputSingle{value: amountIn}(
        //     params
        // );

        // emit SwappedToCbETH(msg.sender, amountOut);
    }
    // Swap cbETH back to ETH but only return the initial stake, keep the yield in the contract
    function swapToETH(uint256 cbETHAmount) external {
        require(
            cbETH.balanceOf(msg.sender) >= cbETHAmount,
            "Insufficient cbETH balance"
        );

        uint256 cbETHRate = getCbETHRate(); // Assume this function fetches the cbETH/ETH rate
        uint256 initialStake = cbETHAmount / cbETHRate;

        require(
            initialStake <= deposits[msg.sender],
            "Cannot withdraw more than initial stake"
        );

        deposits[msg.sender] -= initialStake;

        cbETH.transferFrom(msg.sender, address(this), cbETHAmount);
        // Logic to swap cbETH to ETH and return only initialStake amount to msg.sender
    }

    function createRound(
        uint256 issueRegisStart,
        uint256 votingStart,
        uint256 votingEnd
    ) external onlyAdmin {
        if (rounds[roundId].votingEnd >= block.timestamp) {
            revert RoundOngoing(roundId);
        }
        if (votingStart <= issueRegisStart || votingEnd <= votingStart) {
            revert InvalidRoundTiming();
        }

        // Create a new round
        roundId++;
        rounds[roundId] = Round({
            issueRegisStart: issueRegisStart,
            votingStart: votingStart,
            votingEnd: votingEnd,
            isActive: true
        });

    }

    // Function to cancel a round (before voting starts)
    function cancelRound(uint256 _roundId) external onlyAdmin {
        Round storage round = rounds[_roundId];

        // Ensure that voting has not started yet
        if (block.timestamp >= round.votingStart) {
            revert VotingAlreadyStarted();
        }

        round.isActive = false;
    }

    // Create a donation issue
    function createIssue(
        address _receiver
    ) external {
        require(issueId - roundStartIssueId[roundId] + 2  <= 256, "Max issues reached");
        issueId++;
        issues[roundId] = Issue({
            receiver: _receiver,
            roundId: roundId,
            issueDate: block.timestamp,
            issueID: issueId,
            isActive: true
        });

        if(roundStartIssueId[roundId] == 0){
            roundStartIssueId[roundId] = issueId;
        }
        emit IssueCreated(roundId, issueId);
    }

    // Admin-only function to deactivate an issue
    function deactivateIssue(uint256 _roundId) external onlyOwner {
        issues[_roundId].isActive = false;
        emit IssueDeactivated(_roundId);
    }

    // Vote commits
   // Function to vote YES on multiple issues, updating the YES count and marking the bitmap
    function voteYes(uint256 yesVotes) external {
        uint256 startIssueId = roundStartIssueId[roundId];
        require(rounds[roundId].isActive, "Invactive round");

        uint256 votesBitmap = userVotesBitmap[msg.sender][roundId];

        // Clear already voted bits (skip double votes)
        yesVotes &= ~votesBitmap;

        // Update the userVotesBitmap and userYesVotes with the provided bitmap
        userYesVotes[msg.sender][roundId] |= yesVotes;
        userVotesBitmap[msg.sender][roundId] |= yesVotes;

        // Emit event for YES votes
        emit YesVoted(msg.sender, roundId, yesVotes);
    }

    // Function to vote NO on multiple issues, only marking the general votes bitmap
    function voteNo(uint256 noVotes) external {
        uint256 startIssueId = roundStartIssueId[roundId];
        require(rounds[roundId].isActive, "Invactive round");

        uint256 votesBitmap = userVotesBitmap[msg.sender][roundId];

        // Clear already voted bits (skip double votes)
        noVotes &= ~votesBitmap;

        userVotesBitmap[msg.sender][roundId] |= noVotes;

        // Emit event for NO votes
        emit NoVoted(msg.sender, roundId, noVotes);
    }

    

    // Withdraw any token except cbETH
    function withdrawToken(
        address tokenAddress,
        uint256 amount
    ) external onlyOwner {
        require(
            tokenAddress != cbETHToken,
            "Cannot withdraw cbETH with this function"
        );
        IERC20(tokenAddress).transfer(owner(), amount);
    }

    // Request to withdraw cbETH, requiring 3 admin approvals
    function withdrawCbETH(uint256 amount) external {
        require(
            amount <= cbETH.balanceOf(address(this)),
            "Insufficient cbETH balance"
        );

        withdrawals.push(
            Withdrawal({
                amount: amount,
                requester: msg.sender,
                approved: false
            })
        );
    }

    // Approve cbETH withdrawal by an admin
    function approveCbETHWithdrawal(uint256 requestId) onlyAdmin external {
        require(
            !adminApprovals[requestId][msg.sender],
            "Already approved"
        );

        adminApprovals[requestId][msg.sender] = true;

        // Check if all admins have approved
        uint256 approvalCount;
        for (uint256 i = 0; i < 3; i++) {
            if (adminApprovals[requestId][adminSigners[i]]) {
                approvalCount++;
            }
        }

        if (approvalCount >= 3) {
            // Execute the withdrawal
            cbETH.transfer(
                withdrawals[requestId].requester,
                withdrawals[requestId].amount
            );
            withdrawals[requestId].approved = true;
        }
    }

    // Get the yield from cbETH based on the current cbETH/ETH rate minus the initial deposit
    function getCbETHYield() public view returns (uint256) {
        uint256 cbETHRate = getCbETHRate(); // Assume this fetches the rate of cbETH to ETH
        uint256 cbETHBalance = cbETH.balanceOf(address(this));
        return cbETHBalance - totalDepositedETH * cbETHRate;
    }

    // Dummy function to fetch cbETH/ETH rate
    function getCbETHRate() internal view returns (uint256) {
        return 1000; // Replace this with actual logic to get the cbETH/ETH rate
    }

    modifier onlyAdmin() {
        if (
            msg.sender != adminSigners[0] &&
            msg.sender != adminSigners[1] &&
            msg.sender != adminSigners[2]
        ) {
            revert NotAdmin(); // Revert with custom error instead of require string
        }
        _;
    }
}
