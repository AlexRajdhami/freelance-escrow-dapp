# Technical Report: Freelance Escrow DApp

## Introduction

This project is a hybrid decentralized application designed for freelance job payments. The main goal is to reduce payment disputes between a client and a freelancer by placing funds inside a smart contract until the agreed work is completed. The DApp combines a blockchain back end with a web-based front end, which makes it a good fit for the module focus on mobile and distributed systems. The selected architecture demonstrates how decentralised logic can be combined with a conventional browser interface to produce a usable application.

The system uses Ethereum smart contracts written in Solidity and a React-based frontend that communicates with the blockchain through `ethers.js` and MetaMask. Truffle is used for compilation, testing, migration, and artifact generation, while Ganache provides a controlled local blockchain environment for development and evaluation.

## Back-end Implementation

The back end consists of two Solidity contracts: `Escrow.sol` and `EscrowFactory.sol`. The `EscrowFactory` contract is responsible for deploying new instances of the `Escrow` contract. This approach is useful because each freelance agreement receives its own isolated escrow contract, which improves clarity and avoids mixing state across unrelated jobs.

The `Escrow` contract implements a state machine with the following stages:

- `AWAITING_PAYMENT`
- `AWAITING_DELIVERY`
- `COMPLETE`
- `DISPUTED`
- `REFUNDED`

This state-driven design is an important back-end strength because it prevents invalid actions from being executed out of order. For example, a client cannot release funds before the escrow is funded, and an arbitrator cannot resolve a dispute unless the contract is already in the disputed state.

Access control is enforced through Solidity modifiers such as `onlyClient`, `onlyFreelancer`, and `onlyArbitrator`. This ensures that only the correct participant can trigger each action. The contract also uses a simple reentrancy guard around fund transfer functions. Although the DApp is relatively small, adding this protection improves security and demonstrates awareness of common smart contract vulnerabilities.

One important correction made during development was changing the factory-created escrow so that the real user address is stored as the client, rather than the factory contract address. Without this fix, the deployed escrows would fail core authorization checks. This is a strong example of why testing and careful blockchain integration are critical in DApp development.

## Blockchain Interaction

Blockchain interaction is handled through MetaMask and `ethers.js`. The frontend connects to the injected browser provider, requests account access, and then creates contract instances using the ABI and deployed contract address from the Truffle artifacts. The application supports Ganache for local testing and is structured so that TestNet deployment can also be supported through synced artifact data.

The most important blockchain interactions are:

- creating a new escrow via `EscrowFactory.createEscrow`
- funding an escrow through `Escrow.deposit`
- submitting work through `Escrow.submitWork`
- releasing funds through `Escrow.releaseFunds`
- raising a dispute through `Escrow.raiseDispute`
- resolving a dispute through `Escrow.resolveDispute`

Events are used to communicate deployment results from the blockchain to the frontend. In particular, the `EscrowCreated` event is parsed after the transaction is mined so the UI can obtain the new escrow address. During debugging, the address extraction process was strengthened with a safer fallback that reads the latest escrow addresses from the factory when event parsing is not sufficient. This improvement was necessary because provider and artifact mismatches caused the UI to create escrows successfully while failing to display the resulting address.

Another important improvement was artifact synchronization. A script now copies Truffle build artifacts into the frontend automatically after compilation and migration. This prevents stale contract addresses from remaining in the user interface after redeployment. In practice, this was the main source of deployment-related errors in the project, so solving it significantly improved reliability.

## Front-end Implementation

The front end is implemented in React and organized around three role-based panels:

- `ClientPanel`
- `FreelancerPanel`
- `ArbitratorPanel`

This separation improves usability because each participant only sees the functions that are relevant to their role. The client creates escrows and manages payments, the freelancer loads a contract and submits work, and the arbitrator resolves disputes. The use of a single-page React application is appropriate because it provides a responsive interface for repeated blockchain interactions without page reloads.

From a user experience perspective, the frontend performs input validation before transactions are sent. Ethereum addresses are checked with `ethers.isAddress`, deposit amounts are validated, and helpful status messages are shown during each transaction stage. This is important because blockchain transactions are slower and more expensive than traditional web requests, so client-side validation reduces user frustration and avoids unnecessary failed transactions.

The application also stores recent escrow addresses locally in component state so that users can quickly load the most recently created agreement into the management panel. This is a useful design choice because it bridges the gap between a raw blockchain transaction and a human-friendly workflow.

An IPFS-compatible metadata layer is also included for job descriptions. For development, the system falls back to locally generated pseudo-CIDs when production credentials are not available. This is a practical compromise because it preserves the project structure required for decentralised storage without blocking the development workflow.

## Code Quality and Version Control

The assignment requires evidence of code quality and consistent use of version control. In this project, code quality is improved through both frontend and backend tooling. `Solhint` is used for Solidity contracts, while `ESLint` is used for the React frontend. A root `quality` script now runs both checks together. This supports consistent coding standards and makes the project easier to maintain.

The repository structure also reflects version-controlled development practices. Smart contracts, migrations, tests, and frontend code are separated clearly, and deployment artifacts are generated rather than manually rewritten. Additional submission-oriented improvements include:

- automatic artifact syncing after contract compilation and migration
- updated project documentation
- a dedicated installation manual
- a corrected frontend test

These changes make the repository easier for tutors and lecturers to clone, run, and assess.

## Evaluation

Overall, the project successfully demonstrates the core characteristics of a hybrid DApp. The back end provides blockchain-based trust through smart contracts, the frontend offers a usable web interface, and blockchain interaction is handled through a realistic wallet-driven workflow. The strongest technical aspects are the smart contract state machine, the role-based access model, and the deployment synchronization improvements.

There are still areas that could be improved further. The frontend styling is functional rather than polished, TestNet deployment documentation could be expanded, and persistent storage of recent escrows could be improved beyond in-memory state. However, the current version already satisfies the assignment goal of demonstrating advanced frontend and backend functionality in a DApp context.

## Conclusion

The Freelance Escrow DApp is a suitable CN6035 submission because it clearly combines distributed systems concepts, blockchain interaction, and a modern web frontend. It shows how decentralized trust can be applied to a real-world payment workflow, while also highlighting common implementation challenges such as event parsing, deployment synchronization, and wallet-network alignment. With the added code quality tooling, installation material, and technical explanation, the project now aligns well with the assignment rubric for backend implementation, blockchain interaction, frontend implementation, and code quality/version control.
