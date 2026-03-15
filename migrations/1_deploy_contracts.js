const EscrowFactory = artifacts.require("EscrowFactory");

module.exports = function (deployer, network, accounts) {
  // accounts[0] = client (deployer)
  // accounts[1] = freelancer
  // accounts[2] = arbitrator
  const arbitrator = accounts[2];

  deployer.deploy(EscrowFactory, arbitrator);
};