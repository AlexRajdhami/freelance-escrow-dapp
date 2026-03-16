# Freelance Escrow DApp

A decentralised escrow application built on Ethereum for CN6035.

## Tech Stack
- Solidity 0.8.21
- Truffle + Ganache
- React + ethers.js
- MetaMask

## Installation

### Prerequisites
- Node.js v18
- Truffle: `npm install -g truffle`
- Ganache (desktop app)
- MetaMask browser extension

### Setup
1. Clone the repo:
   git clone https://github.com/AlexRajdhami/freelance-escrow-dapp.git
   cd freelance-escrow-dapp

2. Install dependencies:
   npm install
   cd frontend && npm install

3. Start Ganache and set hardfork to London

4. Deploy contracts:
   truffle migrate --network development --reset

5. Start frontend:
   cd frontend && npm start

6. Open Firefox at localhost:3000 and connect MetaMask

## Smart Contracts
- Escrow.sol — holds funds with state machine (5 states)
- EscrowFactory.sol — deploys and tracks escrow instances

## Testing
Run the test suite:
   truffle test --network development

11 tests covering happy path, dispute path and access control.

## Features
- Client: create escrow, deposit funds, release payment, raise dispute
- Freelancer: view job details, submit work
- Arbitrator: resolve disputes in favour of either party