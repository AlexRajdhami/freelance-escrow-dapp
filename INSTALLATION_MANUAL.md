# Installation Manual

## 1. Prerequisites

Install the following software before running the project:

- `Node.js` version `18` or later
- `Ganache`
- `MetaMask`

## 2. Clone the Repository

```powershell
git clone <your-repository-url>
cd freelance-escrow-dapp
```

## 3. Install Dependencies

Install root dependencies:

```powershell
npm install
```

Install frontend dependencies:

```powershell
cd frontend
npm install
cd ..
```

## 4. Start Ganache

Open Ganache and run a local blockchain instance.

Recommended options:

- RPC URL: `http://127.0.0.1:7545`
- Chain ID: `5777`

You may also use `1337` if your Ganache setup exposes that chain id.

## 5. Import a Ganache Account into MetaMask

1. Copy a private key from Ganache.
2. Open MetaMask.
3. Import the account.
4. Add the same custom network used by Ganache.

## 6. Compile and Deploy Smart Contracts

From the project root:

```powershell
npm run compile
npm run migrate
```

These commands:

- compile the Solidity contracts
- deploy the factory contract
- sync the latest contract artifacts into the React frontend

## 7. Start the Frontend

```powershell
cd frontend
npm start
```

Then open:

`http://localhost:3000`

## 8. Use the DApp

### Client flow

1. Connect MetaMask.
2. Enter a freelancer address and job description.
3. Click `Create Escrow`.
4. Copy or reuse the generated escrow address.
5. Deposit ETH into the escrow.

### Freelancer flow

1. Switch to the freelancer MetaMask account.
2. Load the escrow address.
3. Submit the work.

### Arbitrator flow

1. Switch to the arbitrator account.
2. Load the escrow address.
3. Resolve the dispute if one is raised.

## 9. Run Tests

Smart contract tests:

```powershell
npm test
```

Frontend tests:

```powershell
npm run frontend:test
```

## 10. Run Code Quality Checks

```powershell
npm run quality
```

This runs:

- `Solhint` for Solidity contracts
- `ESLint` for frontend JavaScript

## 11. Troubleshooting

### Problem: frontend cannot find the factory contract

Solution:

```powershell
npm run migrate
```

Then restart the React app.

### Problem: new escrow address is not shown

Solution:

- confirm MetaMask is on the same network as Ganache
- rerun `npm run migrate`
- restart the frontend

### Problem: transaction rejected

Solution:

- confirm the correct account is connected
- confirm the account has test ETH from Ganache
- confirm you approved the MetaMask transaction
