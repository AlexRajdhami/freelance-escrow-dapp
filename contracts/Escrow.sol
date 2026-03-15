// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

/// @title Freelance Escrow Contract
/// @notice Holds funds between client and freelancer with dispute resolution
contract Escrow {

    // ─── Reentrancy guard ────────────────────────────────────────
    bool private locked;
    modifier nonReentrant() {
        require(!locked, "Reentrant call");
        locked = true;
        _;
        locked = false;
    }

    // ─── State machine ───────────────────────────────────────────
    enum State {
        AWAITING_PAYMENT,
        AWAITING_DELIVERY,
        COMPLETE,
        DISPUTED,
        REFUNDED
    }

    // ─── State variables ─────────────────────────────────────────
    address public client;
    address public freelancer;
    address public arbitrator;
    uint256 public amount;
    string  public jobDescription;
    State   public currentState;

    // ─── Events ──────────────────────────────────────────────────
    event FundsDeposited(address indexed client, uint256 amount);
    event WorkSubmitted(address indexed freelancer);
    event FundsReleased(address indexed freelancer, uint256 amount);
    event RefundIssued(address indexed client, uint256 amount);
    event DisputeRaised(address indexed raisedBy);
    event DisputeResolved(address indexed winner, uint256 amount);

    // ─── Modifiers ───────────────────────────────────────────────
    modifier onlyClient() {
        require(msg.sender == client, "Only client can call this");
        _;
    }

    modifier onlyFreelancer() {
        require(msg.sender == freelancer, "Only freelancer can call this");
        _;
    }

    modifier onlyArbitrator() {
        require(msg.sender == arbitrator, "Only arbitrator can call this");
        _;
    }

    modifier inState(State _state) {
        require(currentState == _state, "Invalid state for this action");
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────
    constructor(
        address _freelancer,
        address _arbitrator,
        string memory _jobDescription
    ) {
        require(_freelancer != address(0), "Invalid freelancer address");
        require(_arbitrator != address(0), "Invalid arbitrator address");
        require(_freelancer != msg.sender, "Client cannot be freelancer");

        client         = msg.sender;
        freelancer     = _freelancer;
        arbitrator     = _arbitrator;
        jobDescription = _jobDescription;
        currentState   = State.AWAITING_PAYMENT;
    }

    // ─── Functions ───────────────────────────────────────────────

    /// @notice Client deposits ETH to fund the escrow
    function deposit()
        external
        payable
        onlyClient
        inState(State.AWAITING_PAYMENT)
    {
        require(msg.value > 0, "Deposit must be greater than 0");
        amount = msg.value;
        currentState = State.AWAITING_DELIVERY;
        emit FundsDeposited(msg.sender, msg.value);
    }

    /// @notice Freelancer marks work as submitted
    function submitWork()
        external
        onlyFreelancer
        inState(State.AWAITING_DELIVERY)
    {
        emit WorkSubmitted(msg.sender);
    }

    /// @notice Client approves work and releases funds to freelancer
    function releaseFunds()
        external
        onlyClient
        inState(State.AWAITING_DELIVERY)
        nonReentrant
    {
        currentState = State.COMPLETE;
        uint256 payout = amount;
        amount = 0;
        (bool success, ) = freelancer.call{value: payout}("");
        require(success, "Transfer failed");
        emit FundsReleased(freelancer, payout);
    }

    /// @notice Client raises a dispute
    function raiseDispute()
        external
        onlyClient
        inState(State.AWAITING_DELIVERY)
    {
        currentState = State.DISPUTED;
        emit DisputeRaised(msg.sender);
    }

    /// @notice Arbitrator resolves dispute — true = pay freelancer, false = refund client
    function resolveDispute(bool _releaseToFreelancer)
        external
        onlyArbitrator
        inState(State.DISPUTED)
        nonReentrant
    {
        uint256 payout = amount;
        amount = 0;

        if (_releaseToFreelancer) {
            currentState = State.COMPLETE;
            (bool success, ) = freelancer.call{value: payout}("");
            require(success, "Transfer failed");
            emit DisputeResolved(freelancer, payout);
        } else {
            currentState = State.REFUNDED;
            (bool success, ) = client.call{value: payout}("");
            require(success, "Transfer failed");
            emit DisputeResolved(client, payout);
        }
    }

    /// @notice Returns the contract ETH balance
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}