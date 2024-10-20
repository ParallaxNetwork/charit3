// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { IUniswapV3Pool } from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interface/IV3SwapRouter.sol";

/**
 * @title IWETH
 * @dev Interface for Wrapped ETH (WETH) token, extending the IERC20 interface.
 */
interface IWETH is IERC20 {
    /**
     * @notice Deposits ETH and mints an equivalent amount of WETH.
     * @dev The contract must have a payable fallback or receive function to accept ETH.
     */
    function deposit() external payable;

    /**
     * @notice Burns a specified amount of WETH and withdraws the equivalent amount of ETH.
     * @param amount The amount of WETH to burn and convert back to ETH.
     */
    function withdraw(uint256 amount) external;
}

/**
 * @title DonationManager
 * @dev Manages ETH donations, staking, voting on issues, and handling yield withdrawals using cbETH via Uniswap V3.
 * Inherits from OpenZeppelin's Ownable for access control and ReentrancyGuard to prevent reentrancy attacks.
 */
contract DonationManager is Ownable, ReentrancyGuard {
    /// @notice Instance of the Uniswap V3 SwapRouter interface.
    IV3SwapRouter public swapRouter;

    /// @notice Address of the cbETH token.
    address public cbETH;

    /// @notice Address of the Wrapped ETH (WETH) token.
    address public WETH;

    /// @notice Array of three admin signer addresses.
    address[3] public adminSigners;

    /// @notice Total initial ETH deposited by all users.
    uint256 public initialETHDeposited;

    /// @notice Mapping of user addresses to their initial ETH deposits.
    mapping(address => uint256 initialETHDeposit) public deposits;

    /// @notice Mapping of issue IDs to their respective allocations.
    mapping(uint256 issueId => Allocation) public allocations;
    
    /// @notice Array storing all withdrawal requests.
    Withdrawal[] public withdrawals;

    /// @notice Current round ID.
    uint256 public roundId;

    /// @notice Current issue ID.
    uint256 public issueId;

    /// @notice Mapping of round IDs to their respective Round details.
    mapping(uint256 => Round) public rounds;

    /// @notice Mapping of issue IDs to their respective Issue details.
    mapping(uint256 => Issue) public issues;

    /**
     * @notice Mapping of user addresses to round IDs to a bitmap representing all the issues they've voted YES on.
     * @dev Each bit in the bitmap corresponds to an issue; a set bit indicates a YES vote.
     */
    mapping(address => mapping(uint256 => uint256)) public userYesVotes;

    /**
     * @notice Mapping of user addresses to round IDs to a bitmap representing all the issues they've voted on (YES or NO).
     * @dev Each bit in the bitmap indicates whether the user has voted on that issue.
     */
    mapping(address => mapping(uint256 => uint256)) public userVotesBitmap;

    /**
     * @notice Mapping to track the starting issueId for each round.
     * @dev Ensures that issue IDs are correctly associated with their respective rounds.
     */
    mapping(uint256 => uint256) public roundStartIssueId;

    // ============================
    //           Errors
    // ============================

    /**
     * @dev Error thrown when a non-admin attempts to perform an admin-only action.
     */
    error NotAdmin();

    /**
     * @dev Error thrown when attempting to create a new round while another round is active.
     * @param roundId The ID of the active round causing the error.
     */
    error HasActiveRound(uint256 roundId);

    /**
     * @dev Error thrown when the timing parameters for a round are invalid.
     */
    error InvalidRoundTiming();

    /**
     * @dev Error thrown when attempting to start voting on a round that has already begun.
     */
    error VotingAlreadyStarted();

    /**
     * @dev Error thrown when attempting to withdraw yield but no yield is available.
     */
    error NoYield();

    // ============================
    //           Events
    // ============================

    /**
     * @dev Emitted when a user casts a YES vote on multiple issues.
     * @param voter The address of the voter.
     * @param roundId The ID of the round in which the vote was cast.
     * @param bitmap A bitmap representing the issues voted YES on.
     */
    event YesVoted(
        address indexed voter,
        uint256 indexed roundId,
        uint256 bitmap
    );

    /**
     * @dev Emitted when a user casts a NO vote on multiple issues.
     * @param voter The address of the voter.
     * @param roundId The ID of the round in which the vote was cast.
     * @param bitmap A bitmap representing the issues voted NO on.
     */
    event NoVoted(
        address indexed voter,
        uint256 indexed roundId,
        uint256 bitmap
    );

    /**
     * @dev Emitted when donations are dispersed for a specific round.
     * @param roundId The ID of the round whose donations were dispersed.
     */
    event DonationDispersed(
        uint256 indexed roundId
    );

    /**
     * @dev Emitted when yield is successfully swapped from cbETH to ETH.
     * @param cbETHAmount The amount of cbETH swapped.
     * @param amountOut The amount of ETH received from the swap.
     */
    event YieldSwappedToETH(
        uint256 cbETHAmount, 
        uint256 amountOut
    );

    /**
     * @dev Emitted when a user stakes ETH and receives cbETH.
     * @param sender The address of the user who staked ETH.
     * @param ethAmount The amount of ETH staked.
     */
    event Staked(address sender, uint256 ethAmount);

    /**
     * @dev Emitted when a user unstakes cbETH and receives ETH.
     * @param sender The address of the user who unstaked cbETH.
     * @param cbEthAmount The amount of cbETH unstaked.
     */
    event Unstaked(address sender, uint256 cbEthAmount);

    /**
     * @dev Emitted when a new issue is created.
     * @param roundId The ID of the round in which the issue was created.
     * @param issueID The unique ID of the newly created issue.
     */
    event IssueCreated(uint256 roundId, uint256 issueID);

    /**
     * @dev Emitted when an issue is deactivated.
     * @param roundId The ID of the round associated with the deactivated issue.
     */
    event IssueDeactivated(uint256 roundId);

    // ============================
    //           Structs
    // ============================

    /**
     * @dev Struct representing the allocation of funds to a specific issue.
     * @param issueId The ID of the issue being allocated funds.
     * @param amount The amount of funds allocated to the issue.
     */
    struct Allocation {
        uint256 issueId;
        uint256 amount;
    }

    /**
     * @dev Struct representing a donation issue.
     * @param roundId The ID of the round to which the issue belongs.
     * @param issueID The unique identifier for the issue.
     * @param receiver The address designated to receive the donation.
     * @param issueDate The timestamp when the issue was created.
     * @param isActive A boolean indicating whether the issue is active.
     */
    struct Issue {
        uint256 roundId;
        uint256 issueID;
        address receiver;
        uint256 issueDate;
        bool isActive;
    }

    /**
     * @dev Struct representing a voting round.
     * @param issueRegisStart The timestamp when issue registration starts.
     * @param votingStart The timestamp when voting starts (registration ends).
     * @param votingEnd The timestamp when voting ends.
     * @param isActive A boolean indicating whether the round is active.
     */
    struct Round {
        uint256 issueRegisStart; // When the issue registration period starts
        uint256 votingStart; // When the voting period starts, registration closed
        uint256 votingEnd; // When the voting period ends
        bool isActive;
    }

    /**
     * @dev Struct representing a withdrawal request for cbETH.
     * @param requestId The unique identifier for the withdrawal request.
     * @param amount The amount of cbETH requested for withdrawal.
     * @param requester The address initiating the withdrawal request.
     * @param approved A boolean indicating whether the withdrawal has been approved by admins.
     * @param dispersed A boolean indicating whether the withdrawal has been dispersed.
     */
    struct Withdrawal {
        uint256 requestId;
        uint256 amount;
        address requester;
        bool approved;
        bool dispersed;
    }

    // ============================
    //           Mappings
    // ============================

    /**
     * @notice Mapping of withdrawal request IDs to admin approvals.
     * @dev Maps a requestId to a mapping of admin addresses to their approval status.
     */
    mapping(uint256 => mapping(address => bool)) public adminApprovals; // requestId => admin address => approval

    // ============================
    //        Constructor
    // ============================

    /**
     * @notice Constructs the DonationManager contract.
     * @param _swapRouter The address of the Uniswap V3 SwapRouter.
     * @param _cbETH The address of the cbETH token.
     * @param _WETH The address of the Wrapped ETH (WETH) token.
     * @param _adminSigners An array of three admin signer addresses.
     * @dev The deployer is set as the owner, and the SwapRouter is approved to spend an unlimited amount of WETH.
     */
    constructor(
        address _swapRouter,
        address _cbETH,
        address _WETH,
        address[3] memory _adminSigners
    ) Ownable(msg.sender) {
        swapRouter = IV3SwapRouter(_swapRouter);

        cbETH = _cbETH;
        WETH = _WETH;
        adminSigners = _adminSigners;
        IERC20(WETH).approve(address(swapRouter), type(uint256).max);
    }

    // ============================
    //        Fallbacks
    // ============================

    /**
     * @notice Fallback function to accept ETH sent directly to the contract.
     * @dev Allows the contract to receive ETH without triggering any specific function.
     */
    receive() external payable {}

    // ============================
    //         Functions
    // ============================

    /**
     * @notice Allows users to stake ETH, which is swapped for cbETH via Uniswap V3.
     * @dev Users send ETH along with the transaction, which is then swapped for cbETH using the SwapRouter.
     * Emits a {Staked} event upon successful staking.
     * @param amountOutMinimum The minimum amount of cbETH expected from the swap to prevent slippage.
     */
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

    /**
     * @notice Allows users to unstake ETH by burning their cbETH, returning only the initial stake and retaining any yield.
     * @dev Calculates the equivalent cbETH for the requested ETH amount and transfers it to the user.
     * Emits an {Unstaked} event upon successful unstaking.
     * @param ethAmount The amount of ETH the user wishes to unstake.
     */
    function unstake(uint256 ethAmount) external nonReentrant {
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

    /**
     * @notice Creates a new voting round with specified timings for issue registration and voting.
     * @dev Only callable by an admin. Reverts if there's an active round or if timing parameters are invalid.
     * @param issueRegisStart The timestamp when issue registration starts.
     * @param votingStart The timestamp when voting starts (registration closes).
     * @param votingEnd The timestamp when voting ends.
     */
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

    /**
     * @notice Cancels an active round before voting has commenced.
     * @dev Only callable by an admin. Reverts if voting has already started.
     * @param _roundId The ID of the round to cancel.
     */
    function cancelRound(uint256 _roundId) external onlyAdmin {
        Round storage round = rounds[_roundId];

        // Ensure that voting has not started yet
        if (block.timestamp >= round.votingStart) {
            revert VotingAlreadyStarted();
        }

        round.isActive = false;
    }

    /**
     * @notice Creates a new donation issue associated with the current round.
     * @dev Ensures that the maximum number of issues per round is not exceeded.
     * Emits an {IssueCreated} event upon successful creation.
     * @param _receiver The address designated to receive the donation for this issue.
     */
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

    /**
     * @notice Deactivates a specific donation issue.
     * @dev Only callable by the contract owner. Emits an {IssueDeactivated} event upon successful deactivation.
     * @param _issueId The ID of the issue to deactivate.
     */
    function deactivateIssue(uint256 _issueId) external onlyOwner {
        issues[_issueId].isActive = false;
        emit IssueDeactivated(_issueId);
    }

    /**
     * @notice Allows stakers to cast YES votes on multiple issues by updating vote counts and marking the bitmap.
     * @dev Only callable by users with a minimum stake. Emits a {YesVoted} event upon successful voting.
     * @param yesVotes A bitmap where each set bit represents a YES vote on the corresponding issue.
     */
    function voteYes(uint256 yesVotes) external {
        require(rounds[roundId].isActive, "Inactive round");

        uint256 votesBitmap = userVotesBitmap[msg.sender][roundId];

        // Clear already voted bits (skip double votes)
        yesVotes &= ~votesBitmap;

        // Update the userVotesBitmap and userYesVotes with the provided bitmap
        userYesVotes[msg.sender][roundId] |= yesVotes;
        userVotesBitmap[msg.sender][roundId] |= yesVotes;

        // Emit event for YES votes
        emit YesVoted(msg.sender, roundId, yesVotes);
    }

    /**
     * @notice Allows users to cast NO votes on multiple issues by marking the general votes bitmap.
     * @dev Emits a {NoVoted} event upon successful voting.
     * @param noVotes A bitmap where each set bit represents a NO vote on the corresponding issue.
     */
    function voteNo(uint256 noVotes) external {
        require(rounds[roundId].isActive, "Inactive round");

        uint256 votesBitmap = userVotesBitmap[msg.sender][roundId];

        // Clear already voted bits (skip double votes)
        noVotes &= ~votesBitmap;

        userVotesBitmap[msg.sender][roundId] |= noVotes;

        // Emit event for NO votes
        emit NoVoted(msg.sender, roundId, noVotes);
    }

    /**
     * @notice Allows the contract owner to withdraw any ERC20 token except cbETH.
     * @dev Transfers the specified amount of the token to the owner.
     * @param tokenAddress The address of the ERC20 token to withdraw.
     * @param amount The amount of the token to withdraw.
     */
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

    /**
     * @notice Allows admins to request a withdrawal of cbETH yield, requiring approvals from all admins.
     * @dev Calculates the maximum withdrawable cbETH based on yield and creates a withdrawal request.
     * Emits a {Withdrawal} event upon successful request creation.
     * @param amount The amount of cbETH to withdraw.
     */
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

    /**
     * @notice Retrieves the current price of cbETH in terms of ETH from the Uniswap V3 pool.
     * @dev Fetches the current sqrt price from the pool and calculates the price.
     * @return priceInETH The price of cbETH in ETH, scaled by 1e18.
     */
    function getCbETHToETHPrice() public view returns (uint256 priceInETH) {
        // Get the pool contract at the known address
        IUniswapV3Pool pool = IUniswapV3Pool(0x10648BA41B8565907Cfa1496765fA4D95390aa0d);

        // Fetch slot0, which includes the current sqrtPriceX96
        (uint160 sqrtPriceX96,,,,,,) = pool.slot0();

        // Convert sqrtPriceX96 to human-readable price (cbETH per WETH/ETH)
        priceInETH = (uint256(sqrtPriceX96) ** 2) * 1e18 / (2 ** 192);
        return priceInETH;
    }

    /**
     * @notice Calculates the current price of ETH in terms of cbETH.
     * @dev Inverts the cbETH to ETH price to get ETH to cbETH price.
     * @return priceInCbETH The price of ETH in cbETH, scaled by 1e18.
     */
    function getETHToCbETHPrice() public view returns (uint256 priceInCbETH) {
        uint256 cbETHToETHPrice = getCbETHToETHPrice();
        // Invert the price to get ETH to cbETH price
        priceInCbETH = 1e18 * 1e18 / cbETHToETHPrice;
        return priceInCbETH;
    }

    /**
     * @notice Allows an admin to approve a cbETH withdrawal request.
     * @dev Each admin can approve a withdrawal request. Once all admins have approved, the withdrawal is marked as approved.
     * @param requestId The ID of the withdrawal request to approve.
     */
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

    /**
     * @notice Disperses donations to specified recipients after approval.
     * @dev Only callable by an admin. Requires that the voting period has ended and the withdrawal request is approved.
     * Transfers the specified amounts of ETH to each recipient.
     * Emits a {DonationDispersed} event upon successful dispersal.
     * @param recipients An array of recipient addresses to receive the donations.
     * @param values An array of ETH amounts corresponding to each recipient.
     * @param requestId The ID of the approved withdrawal request.
     */
    function disperseDonation(address[] calldata recipients, uint256[] calldata values, uint256 requestId) external nonReentrant onlyAdmin() {
        if(rounds[roundId].votingEnd > block.timestamp){
            revert HasActiveRound(roundId);
        }

        require(withdrawals[requestId].approved, "Not approved");
        uint256 totalAmount = 0;

        for (uint256 i = 0; i < recipients.length; i++) {
            totalAmount += values[i];
            require(totalAmount <= withdrawals[requestId].amount, "Insufficient balance");
            (bool success, ) = recipients[i].call{value: values[i]}("");
            require(success, "Transfer failed");
        }

        rounds[roundId].isActive = false;

        withdrawals[requestId].dispersed = true;
        emit DonationDispersed(roundId);
    }

    /**
     * @notice Allows the contract owner to withdraw all ETH from the contract.
     * @dev Transfers the entire ETH balance of the contract to the owner.
     * Emits no events.
     */
    function withdrawETH() external nonReentrant onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");

        (bool success, ) = owner().call{value: balance}("");
        require(success, "Transfer failed");
    }

    // ============================
    //          Modifiers
    // ============================

    /**
     * @dev Modifier to restrict function access to only admin signers.
     * Reverts with {NotAdmin} error if the caller is not an admin.
     */
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
