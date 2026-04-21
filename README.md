# Freelance Escrow DApp

`Freelance Escrow DApp` is a hybrid decentralized application built for `CN6035`. It combines a React frontend, Ethereum smart contracts, and MetaMask-based user interaction to support escrow agreements between a client, a freelancer, and an arbitrator.

## Features

- Create a new escrow agreement from the client account
- Deposit ETH into the escrow contract
- Submit work from the freelancer account
- Release payment from the client account
- Raise and resolve disputes through an arbitrator
- Store job metadata with an IPFS-compatible fallback flow

## Technology Stack

- `Solidity 0.8.21`
- `Truffle`
- `Ganache`
- `React`
- `ethers.js`
- `MetaMask`
- `ESLint`
- `Solhint`

## Project Structure

- `contracts/`: Solidity contracts
- `migrations/`: Truffle deployment scripts
- `test/`: smart contract tests
- `frontend/`: React user interface
- `build/contracts/`: compiled Truffle artifacts
- `scripts/sync-artifacts.js`: copies updated artifacts into the frontend

## Smart Contracts

- `Escrow.sol`
  Holds funds and enforces the escrow state machine.
- `EscrowFactory.sol`
  Deploys new escrow contracts and records their addresses.

## Setup

### Prerequisites

- `Node.js 18+`
- `Ganache` desktop or CLI
- `MetaMask`

### Install Dependencies

From the repository root:

```powershell
npm install
cd frontend
npm install
cd ..
```

### Start Ganache

Use Ganache on either:

- `127.0.0.1:7545` with chain id `5777`
- `127.0.0.1:8545` with chain id `1337`

Import one of the Ganache accounts into MetaMask.

### Compile and Deploy

```powershell
npm run compile
npm run migrate
```

The `compile` and `migrate` scripts automatically sync the latest contract artifacts into the frontend so the UI uses the newest deployment data.

### Start the Frontend

```powershell
cd frontend
npm start
```

Open `http://localhost:3000` and connect MetaMask to the same network as Ganache.

## Testing and Code Quality

Run smart contract tests:

```powershell
npm test
```

Run frontend tests:

```powershell
npm run frontend:test
```

Run code quality checks:

```powershell
npm run quality
```

## Submission Materials

The following documents are included for the assignment:

- [INSTALLATION_MANUAL.md](C:\Users\Dell\Documents\freelance-escrow-dapp\INSTALLATION_MANUAL.md)
- [TECHNICAL_REPORT.md](C:\Users\Dell\Documents\freelance-escrow-dapp\TECHNICAL_REPORT.md)

## Notes

- The frontend now resolves contract addresses from synced Truffle artifacts rather than relying on stale hardcoded deployments.
- If Ganache is reset, rerun `npm run migrate` before starting the UI.
