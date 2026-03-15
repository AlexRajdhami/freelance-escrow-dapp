const EscrowFactory = artifacts.require("EscrowFactory");

module.exports = async function (deployer, network, accounts) {
  const arbitrator = accounts[2];
  
  console.log("Deploying with arbitrator:", arbitrator);
  
  await deployer.deploy(EscrowFactory, arbitrator);
  
  const factory = await EscrowFactory.deployed();
  console.log("EscrowFactory deployed at:", factory.address);
};