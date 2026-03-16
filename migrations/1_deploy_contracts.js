const EscrowFactory = artifacts.require("EscrowFactory");

module.exports = async function (deployer, network, accounts) {
  let arbitrator;

  if (network === 'sepolia') {
    // Use your own address as arbitrator on Sepolia
    arbitrator = '0x654a7aa7B10D19640FCB4F5Cadf73c54ca6ab4C6';
  } else {
    arbitrator = accounts[2];
  }

  console.log("Deploying with arbitrator:", arbitrator);

  await deployer.deploy(EscrowFactory, arbitrator);

  const factory = await EscrowFactory.deployed();
  console.log("EscrowFactory deployed at:", factory.address);
};