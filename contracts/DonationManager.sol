// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { IUniswapV3Pool } from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interface/IV3SwapRouter.sol";

interface IWETH is IERC20 {
    /// @notice Deposit ether to get wrapped ether
    function deposit() external payable;

    /// @notice Withdraw wrapped ether to get ether
    function withdraw(uint256) external;
}

contract DonationManager is Ownable, ReentrancyGuard {
    IV3SwapRouter public swapRouter;

    address public constant cbETH = 0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22;
    address public constant WETH = 0x4200000000000000000000000000000000000006;

    address[3] public adminSigners;
    uint256 public initialETHDeposited;

    mapping(address => uint256 initialETHDeposit) public deposits;
    mapping(uint256 issueId => Allocation) public allocations;
    
    Withdrawal[] public withdrawals;

    uint256 public roundId;
    uint256 public issueId;
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
    error NoYield();

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
        uint256 indexed roundId
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
        uint256 requestId;
        uint256 amount;
        address requester;
        bool approved;
        bool dispersed;
    }

    mapping(uint256 => mapping(address => bool)) public adminApprovals; // requestId => admin address => approval

    event Staked(address sender, uint256 ethAmount);
    event Unstaked(address sender, uint256 cbEthAmount);
    event IssueCreated(uint256 roundId, uint256 issueID);
    event IssueDeactivated(uint256 roundId);

    constructor(
        address _swapRouter,
        address[3] memory _adminSigners
    ) Ownable(msg.sender) {
        swapRouter = IV3SwapRouter(_swapRouter);
        adminSigners = _adminSigners;
    }

    receive() external payable {}

// stake in cbETH stored in the contract
    function stake(uint256 amountOutMinimum) payable external nonReentrant {
        
        deposits[msg.sender] += msg.value;
        initialETHDeposited += msg.value;

        require(msg.value > 0, "Must pass non-zero ETH amount");

        // Define swap parameters
        IV3SwapRouter.ExactInputSingleParams memory params =
            IV3SwapRouter.ExactInputSingleParams({
                tokenIn: address(WETH),
                tokenOut: address(cbETH),
                fee: 3000,
                recipient: address(this),
                amountIn: msg.value,
                amountOutMinimum: amountOutMinimum,
                sqrtPriceLimitX96: 0 // No price limit
            });

        // Execute the swap
        uint256 amountOut = swapRouter.exactInputSingle{value: msg.value}(params);

        require(amountOut >= amountOutMinimum, "Insufficient output amount");

        emit Staked(msg.sender, msg.value);
    }

    // Swap cbETH back to ETH but only return the initial stake, keep the yield in the contract
    function unstake(uint256 ethAmount) external nonReentrant{
        require(deposits[msg.sender] >= ethAmount, "Insufficient ETH balance");

        // Calculate cbETH equivalent of ethAmount
        uint256 ethToCbETHPrice = getETHToCbETHPrice();
        uint256 cbETHAmount = (ethAmount * 1e18) / ethToCbETHPrice;

        // Transfer cbETH to the sender
        require(IERC20(cbETH).transfer(msg.sender, cbETHAmount), "Transfer failed");

        deposits[msg.sender] -= ethAmount;
        initialETHDeposited -= ethAmount;

        emit Unstaked(msg.sender, cbETHAmount);
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
    function deactivateIssue(uint256 _issueId) external onlyOwner {
        issues[_issueId].isActive = false;
        emit IssueDeactivated(_issueId);
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

    // Request to withdraw cbETH, requiring 3 admin approvals, only yields
    function withdrawCbETH(uint256 amount) external nonReentrant onlyAdmin {
        uint256 currentCbETHBalance = IERC20(cbETH).balanceOf(address(this));

        // Calculate the total ETH value of the current cbETH balance in the contract
        uint256 cbETHPriceInETH = getCbETHToETHPrice();
        uint256 totalETHValue = (currentCbETHBalance * getCbETHToETHPrice()) / 1e18;

        // Calculate the excess ETH value over the initial ETH deposited (yield)
        if(totalETHValue <= initialETHDeposited)
            revert NoYield();

        uint256 yieldInETH = totalETHValue - initialETHDeposited;

        // Calculate the maximum amount of cbETH that can be withdrawn, which is yield only
        uint256 maxWithdrawableCbETH = (yieldInETH * 1e18) / cbETHPriceInETH;

        // Ensure the requested amount is less than or equal to the withdrawable amount (yield)
        require(amount <= maxWithdrawableCbETH, "Amount exceeds yield");

        withdrawals.push(
            Withdrawal({
                requestId: withdrawals.length + 1,
                amount: amount,
                requester: msg.sender,
                approved: false,
                dispersed: false
            })
        );

        adminApprovals[withdrawals.length][msg.sender] = true;
    }

    function getCbETHToETHPrice() public view returns (uint256 priceInETH) {
        // Get the pool contract at the known address
        IUniswapV3Pool pool = IUniswapV3Pool(0x10648BA41B8565907Cfa1496765fA4D95390aa0d);

        // Fetch slot0, which includes the current sqrtPriceX96
        (uint160 sqrtPriceX96,,,,,,) = pool.slot0();

        // Convert sqrtPriceX96 to human-readable price (cbETH per WETH/ETH)
        priceInETH = (uint256(sqrtPriceX96) ** 2) * 1e18 / (2 ** 192);
        return priceInETH;
    }

    function getETHToCbETHPrice() public view returns (uint256 priceInCbETH) {
        uint256 cbETHToETHPrice = getCbETHToETHPrice();
        // Invert the price to get ETH to cbETH price
        priceInCbETH = 1e18 * 1e18 / cbETHToETHPrice;
        return priceInCbETH;
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
            withdrawals[requestId].approved = true;
        }
    }

    function disperseDonation(address[] calldata recipients, uint256[] calldata values, uint256 requestId) external nonReentrant onlyAdmin() {
        if(rounds[roundId].votingEnd > block.timestamp){
            revert HasActiveRound(roundId);
        }

        require(withdrawals[requestId].approved, "Not approved");
        uint256 totalAmount = 0;

        for (uint256 i = 0; i < recipients.length; i++) {
            totalAmount += values[i];
            require(totalAmount <= withdrawals[requestId].amount, "Amount exceeds withdrawal amount");
            (bool success, ) = recipients[i].call{value: values[i]}("");
            require(success, "Transfer failed");
        }

        rounds[roundId].isActive = false;

        withdrawals[requestId].dispersed = true;
        emit DonationDispersed(roundId);
    }

    function withdrawETH() external nonReentrant onlyOwner {
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
