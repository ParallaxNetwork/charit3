// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ISwapRouter} from "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import { IQuoter } from "@uniswap/v3-periphery/contracts/interfaces/IQuoter.sol";
import { IWETH } from "@uniswap/v3-periphery/contracts/interfaces/external/IWETH9.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract DonationManager is Ownable {
    ISwapRouter public swapRouter;
    IQuoter public quoter;

    address public constant cbETH = 0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22;
    address public constant WETH9 = 0x4200000000000000000000000000000000000006;

    address[3] public adminSigners;
    uint256 public initialETHDeposited;

    mapping(address => uint256 initialDeposit) public deposits;
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
    error HasActiveRound(uint256 roundId);
    error InvalidRoundTiming();
    error VotingAlreadyStarted();
    error InvalidYield();

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

    event DonationDispersed(
        uint256 indexed roundId,
        uint256 amount
    );

    event YieldSwappedToETH(
        uint256 cbETHAmount, 
        uint256 amountOut
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
    event SwappedToETH(address sender, uint256 ETHAmount);
    event IssueCreated(uint256 roundId, uint256 issueID);
    event IssueDeactivated(uint256 roundId);

    constructor(
        address _swapRouter,
        address _quoter,
        address[3] memory _adminSigners
    ) Ownable(msg.sender) {
        swapRouter = ISwapRouter(_swapRouter);
        quoter = IQuoter(_quoter);
        adminSigners = _adminSigners;
    }

    receive() external payable {}

    // Swap the sender's deposited ETH for cbETH
    function depositToCbETH() external payable {
        require(msg.value > 0, "ETH amount must be greater than 0");

        uint256 estimatedAmountOut = getEstimatedCbETHForETH(msg.value);
        uint256 amountOutMinimum = estimatedAmountOut * 99 / 100;  // 1% slippage tolerance

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: WETH9,
            tokenOut: cbETH,
            fee: 500,
            recipient: msg.sender, // For testing purpose
            deadline: block.timestamp + 15,
            amountIn: msg.value,
            amountOutMinimum: amountOutMinimum,
            sqrtPriceLimitX96: 0
        });

        uint256 amountOut = swapRouter.exactInputSingle{value: msg.value}(params);
        deposits[msg.sender] += msg.value;
        initialETHDeposited += msg.value;
        emit SwappedToCbETH(msg.sender, amountOut);
    }

    function getEstimatedCbETHForETH(uint256 amountIn) public returns (uint256) {
        uint256 estimatedAmountOut = quoter.quoteExactInputSingle(
            WETH9,
            cbETH,
            500,
            amountIn,
            0
        );

        return estimatedAmountOut;
    }

    function getEstimatedETHForCbETH(uint256 amountIn) public returns (uint256) {
        uint256 estimatedAmountOut = quoter.quoteExactInputSingle(
            cbETH,
            WETH9,
            500,
            amountIn,
            0
        );

        return estimatedAmountOut;
    }

    // Swap cbETH back to ETH but only return the initial stake, keep the yield in the contract
    function withdrawToETH(uint256 ethAmount) external {
        require(deposits[msg.sender] >= ethAmount, "Insufficient ETH balance");

        // Get the estimated amount of cbETH needed to get the requested ethAmount
        uint256 estimatedCbETHNeeded = getEstimatedCbETHForETH(ethAmount);

        // Transfer the estimated cbETH amount from the user to this contract
        require(IERC20(cbETH).balanceOf(msg.sender) >= estimatedCbETHNeeded, "Insufficient cbETH balance");
        IERC20(cbETH).transferFrom(msg.sender, address(this), estimatedCbETHNeeded);
        IERC20(cbETH).approve(address(swapRouter), estimatedCbETHNeeded);

        // Perform the swap: cbETH -> WETH -> ETH
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: cbETH,
            tokenOut: WETH9,
            fee: 500,
            recipient: address(this),
            deadline: block.timestamp + 15,
            amountIn: estimatedCbETHNeeded,  // Swap only the necessary amount of cbETH
            amountOutMinimum: ethAmount * 99 / 100,  // 1% slippage tolerance for the minimum ETH output
            sqrtPriceLimitX96: 0
        });

        uint256 amountOut = swapRouter.exactInputSingle(params);

        // Ensure the swapped ETH is enough to meet the requested amount
        require(amountOut >= ethAmount, "Insufficient ETH received");

        // Unwrap WETH to ETH and transfer ETH to the user
        IWETH9(WETH9).withdraw(amountOut);

        (bool success, ) = msg.sender.call{value: amountOut}("");
        require(success, "ETH transfer failed");
        deposits[msg.sender] -= ethAmount;
        initialETHDeposited -= ethAmount;

        emit SwappedToETH(msg.sender, estimatedCbETHNeeded, amountOut);
    }


    function createRound(
        uint256 issueRegisStart,
        uint256 votingStart,
        uint256 votingEnd
    ) external onlyAdmin {
        if (rounds[roundId].isActive) {
            revert HasActiveRound(roundId);
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
            tokenAddress != cbETH,
            "Cannot withdraw cbETH with this function"
        );
        IERC20(tokenAddress).transfer(owner(), amount);
    }

    // Request to withdraw cbETH, requiring 3 admin approvals
    function withdrawCbETH(uint256 amount) external {
        require(
            amount <= IERC20(cbETH).balanceOf(address(this)),
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
            IERC20(cbETH).transfer(
                withdrawals[requestId].requester,
                withdrawals[requestId].amount
            );
            withdrawals[requestId].approved = true;
        }
    }

    function getYieldAmount() external view returns (uint256) {
        uint256 cbETHToETH = getEstimatedETHForCbETH(IERC20(cbETH).balanceOf(address(this)));

        return cbETHToETH > initialETHDeposited ? cbETHToETH - initialETHDeposited : 0;
    }

    function swapYieldToETH() internal {
        uint256 yieldAmount = getYieldAmount();  // Yield in ETH
        if (yieldAmount == 0) {
            revert InvalidYield();
        }

        // Get the estimated amount of cbETH needed to get the yieldAmount in ETH
        uint256 cbETHAmount = getEstimatedCbETHForETH(yieldAmount);
        
        // Transfer cbETH from the contract to the router
        IERC20(cbETH).approve(address(swapRouter), cbETHAmount);

        // Perform the swap: cbETH -> WETH -> ETH
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: cbETH,
            tokenOut: WETH9,
            fee: 500,
            recipient: address(this),  // Contract receives the ETH output
            deadline: block.timestamp + 15,
            amountIn: cbETHAmount,
            amountOutMinimum: yieldAmount * 99 / 100,  // 1% slippage tolerance
            sqrtPriceLimitX96: 0
        });

        // Execute the swap
        uint256 amountOut = swapRouter.exactInputSingle(params);

        // Unwrap WETH to ETH, keep in contract
        IWETH9(WETH9).withdraw(amountOut);

        emit YieldSwappedToETH(cbETHAmount, amountOut);
    }


    function disperseDonation(address[] calldata recipients, uint256[] calldata values) external onlyAdmin() {
        if(rounds[roundId].votingEnd > block.timestamp){
            revert HasActiveRound(roundId);
        }

        swapYieldToETH();
        for (uint256 i = 0; i < recipients.length; i++) {
            (bool success, ) = recipients[i].call{value: values[i]}("");
            require(success, "Transfer failed");
        }

        rounds[roundId].isActive = false;
        emit DonationDispersed(roundId, msg.value);
    }

    function withdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH balance to withdraw");

        (bool success, ) = owner().call{value: balance}("");
        require(success, "ETH transfer failed");
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
