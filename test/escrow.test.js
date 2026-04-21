const EscrowFactory = artifacts.require("EscrowFactory");
const Escrow = artifacts.require("Escrow");

contract("Escrow", accounts => {
  const [client, freelancer, arbitrator] = accounts;
  let factory;
  let escrow;
  const jobDescription = "Build a website";

  beforeEach(async () => {
    factory = await EscrowFactory.new(arbitrator);
    const tx = await factory.createEscrow(freelancer, jobDescription);
    const escrowAddress = tx.logs[0].args.escrowAddress;
    escrow = await Escrow.at(escrowAddress);
  });

  it("should create escrow with correct details", async () => {
    assert.equal(await escrow.client(), client);
    assert.equal(await escrow.freelancer(), freelancer);
    assert.equal(await escrow.arbitrator(), arbitrator);
    assert.equal(await escrow.jobDescription(), jobDescription);
  });

  it("should allow client to deposit funds", async () => {
    await escrow.deposit({ value: web3.utils.toWei("1", "ether"), from: client });
    const balance = await web3.eth.getBalance(escrow.address);
    assert.equal(balance, web3.utils.toWei("1", "ether"));
  });

  it("should allow freelancer to submit work", async () => {
    await escrow.deposit({ value: web3.utils.toWei("1", "ether"), from: client });
    const tx = await escrow.submitWork({ from: freelancer });
    assert.equal(tx.logs[0].event, "WorkSubmitted");
    assert.equal(tx.logs[0].args.freelancer, freelancer);
  });

  it("should allow client to release funds after work submission", async () => {
    await escrow.deposit({ value: web3.utils.toWei("1", "ether"), from: client });
    await escrow.submitWork({ from: freelancer });
    
    const freelancerBalanceBefore = await web3.eth.getBalance(freelancer);
    await escrow.releaseFunds({ from: client });
    const freelancerBalanceAfter = await web3.eth.getBalance(freelancer);
    
    // Freelancer should receive the funds (minus gas)
    assert.isAbove(Number(freelancerBalanceAfter), Number(freelancerBalanceBefore));
  });

  it("should emit the real client address when escrow is created", async () => {
    const tx = await factory.createEscrow(freelancer, "Another job", { from: client });
    assert.equal(tx.logs[0].args.client, client);
  });
});
