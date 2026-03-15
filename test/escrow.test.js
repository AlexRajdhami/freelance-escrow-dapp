const EscrowFactory = artifacts.require("EscrowFactory");
const Escrow = artifacts.require("Escrow");

contract("EscrowFactory", (accounts) => {
  const client     = accounts[0];
  const freelancer = accounts[1];
  const arbitrator = accounts[2];
  const jobDesc    = "Build a React website";

  let factory;

  beforeEach(async () => {
    factory = await EscrowFactory.new(arbitrator, { from: client });
  });

  it("deploys with correct arbitrator", async () => {
    const arb = await factory.arbitrator();
    assert.equal(arb, arbitrator, "Arbitrator should match");
  });

  it("creates a new escrow contract", async () => {
    await factory.createEscrow(freelancer, jobDesc, { from: client });
    const count = await factory.getEscrowCount();
    assert.equal(count.toNumber(), 1, "Escrow count should be 1");
  });

  it("returns all escrow addresses", async () => {
    await factory.createEscrow(freelancer, jobDesc, { from: client });
    const escrows = await factory.getAllEscrows();
    assert.equal(escrows.length, 1, "Should have 1 escrow");
  });
});

contract("Escrow - happy path", (accounts) => {
  const client     = accounts[0];
  const freelancer = accounts[1];
  const arbitrator = accounts[2];
  const jobDesc    = "Build a React website";
  const amount     = web3.utils.toWei("1", "ether");

  let escrow;

  beforeEach(async () => {
    escrow = await Escrow.new(freelancer, arbitrator, jobDesc, { from: client });
  });

  it("sets correct initial state", async () => {
    const state = await escrow.currentState();
    assert.equal(state.toNumber(), 0, "Initial state should be AWAITING_PAYMENT");
  });

  it("client can deposit funds", async () => {
    await escrow.deposit({ from: client, value: amount });
    const state = await escrow.currentState();
    assert.equal(state.toNumber(), 1, "State should be AWAITING_DELIVERY");
  });

  it("freelancer can submit work", async () => {
    await escrow.deposit({ from: client, value: amount });
    await escrow.submitWork({ from: freelancer });
    const state = await escrow.currentState();
    assert.equal(state.toNumber(), 1, "State should still be AWAITING_DELIVERY");
  });

  it("client can release funds to freelancer", async () => {
    await escrow.deposit({ from: client, value: amount });
    const balanceBefore = BigInt(await web3.eth.getBalance(freelancer));
    await escrow.releaseFunds({ from: client });
    const balanceAfter = BigInt(await web3.eth.getBalance(freelancer));
    assert(balanceAfter > balanceBefore, "Freelancer should receive funds");
    const state = await escrow.currentState();
    assert.equal(state.toNumber(), 2, "State should be COMPLETE");
  });
});

contract("Escrow - dispute path", (accounts) => {
  const client     = accounts[0];
  const freelancer = accounts[1];
  const arbitrator = accounts[2];
  const jobDesc    = "Build a React website";
  const amount     = web3.utils.toWei("1", "ether");

  let escrow;

  beforeEach(async () => {
    escrow = await Escrow.new(freelancer, arbitrator, jobDesc, { from: client });
    await escrow.deposit({ from: client, value: amount });
  });

  it("client can raise a dispute", async () => {
    await escrow.raiseDispute({ from: client });
    const state = await escrow.currentState();
    assert.equal(state.toNumber(), 3, "State should be DISPUTED");
  });

  it("arbitrator can resolve in favour of freelancer", async () => {
    await escrow.raiseDispute({ from: client });
    const balanceBefore = BigInt(await web3.eth.getBalance(freelancer));
    await escrow.resolveDispute(true, { from: arbitrator });
    const balanceAfter = BigInt(await web3.eth.getBalance(freelancer));
    assert(balanceAfter > balanceBefore, "Freelancer should receive funds");
    const state = await escrow.currentState();
    assert.equal(state.toNumber(), 2, "State should be COMPLETE");
  });

  it("arbitrator can resolve in favour of client", async () => {
    await escrow.raiseDispute({ from: client });
    const balanceBefore = BigInt(await web3.eth.getBalance(client));
    await escrow.resolveDispute(false, { from: arbitrator });
    const balanceAfter = BigInt(await web3.eth.getBalance(client));
    assert(balanceAfter > balanceBefore, "Client should be refunded");
    const state = await escrow.currentState();
    assert.equal(state.toNumber(), 4, "State should be REFUNDED");
  });

  it("non-arbitrator cannot resolve dispute", async () => {
    await escrow.raiseDispute({ from: client });
    try {
      await escrow.resolveDispute(true, { from: freelancer });
      assert.fail("Should have thrown");
    } catch (err) {
      assert(err.message.includes("Only arbitrator"), "Wrong error message");
    }
  });
});