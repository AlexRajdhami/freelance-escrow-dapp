# Frontend

This folder contains the React frontend for the `Freelance Escrow DApp`.

## Main Responsibilities

- connect MetaMask
- show separate client, freelancer, and arbitrator workflows
- create escrows through the factory contract
- read synced Truffle artifacts from `src/utils`
- display recent escrow addresses for follow-up actions

## Run

```powershell
npm install
npm start
```

## Lint

```powershell
npm run lint
```

## Important Detail

Contract artifacts are copied from the Truffle build output by the root script:

```powershell
npm run sync:artifacts
```

If contracts are redeployed, rerun the root compile or migrate scripts before testing the UI.
