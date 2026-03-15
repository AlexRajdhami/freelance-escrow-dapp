// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "./Escrow.sol";

/// @title Escrow Factory Contract
/// @notice Deploys and tracks individual Escrow contracts
contract EscrowFactory {

    // ─── State variables ─────────────────────────────────────────
    address public arbitrator;
    address[] public escrowContracts;

    // ─── Events ──────────────────────────────────────────────────
    event EscrowCreated(
        address indexed escrowAddress,
        address indexed client,
        address indexed freelancer,
        string jobDescription
    );

    // ─── Constructor ─────────────────────────────────────────────
    constructor(address _arbitrator) {
        require(_arbitrator != address(0), "Invalid arbitrator address");
        arbitrator = _arbitrator;
    }

    // ─── Functions ───────────────────────────────────────────────

    /// @notice Creates a new Escrow contract
    /// @param _freelancer Address of the freelancer
    /// @param _jobDescription Description of the job
    /// @return Address of the newly deployed Escrow contract
    function createEscrow(
        address _freelancer,
        string memory _jobDescription
    ) external returns (address) {
        Escrow newEscrow = new Escrow(
            _freelancer,
            arbitrator,
            _jobDescription
        );

        escrowContracts.push(address(newEscrow));

        emit EscrowCreated(
            address(newEscrow),
            msg.sender,
            _freelancer,
            _jobDescription
        );

        return address(newEscrow);
    }

    /// @notice Returns all deployed escrow contract addresses
    function getAllEscrows() external view returns (address[] memory) {
        return escrowContracts;
    }

    /// @notice Returns total number of escrows created
    function getEscrowCount() external view returns (uint256) {
        return escrowContracts.length;
    }
}