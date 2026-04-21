const EscrowFactory = artifacts.require("EscrowFactory");

module.exports = async function(deployer, network, accounts) {
  // Use the first account as arbitrator for testing
  const arbitrator = accounts[0];
  
  console.log("Deploying EscrowFactory with arbitrator:", arbitrator);
  await deployer.deploy(EscrowFactory, arbitrator);
  
  const factory = await EscrowFactory.deployed();
  console.log("EscrowFactory deployed at:", factory.address);
};