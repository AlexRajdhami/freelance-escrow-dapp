import { ethers } from 'ethers';
import EscrowFactoryArtifact from './EscrowFactory.json';
import EscrowArtifact from './Escrow.json';

const getArtifactNetworkAddresses = (artifact) =>
  Object.fromEntries(
    Object.entries(artifact.networks || {}).map(([networkId, value]) => [
      Number(networkId),
      value.address
    ])
  );

export const DEPLOYED_FACTORY_ADDRESSES = getArtifactNetworkAddresses(EscrowFactoryArtifact);

const LOCAL_NETWORK_IDS = [1337, 5777];

export const FACTORY_ADDRESS =
  process.env.REACT_APP_FACTORY_ADDRESS ||
  process.env.NEXT_PUBLIC_FACTORY_ADDRESS ||
  DEPLOYED_FACTORY_ADDRESSES[5777] ||
  '';

export const FACTORY_ABI = EscrowFactoryArtifact.abi;
export const ESCROW_ABI = EscrowArtifact.abi;

export const SUPPORTED_NETWORKS = {
  11155111: {
    name: 'Sepolia Testnet',
    chainId: 11155111,
    explorer: 'https://sepolia.etherscan.io',
    rpcUrl: process.env.REACT_APP_SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/'
  },
  5777: {
    name: 'Ganache Local',
    chainId: 5777,
    explorer: null,
    rpcUrl: 'http://127.0.0.1:7545'
  },
  1337: {
    name: 'Local Dev',
    chainId: 1337,
    explorer: null,
    rpcUrl: 'http://127.0.0.1:8545'
  }
};

export const validateNetwork = async (provider) => {
  try {
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);
    const supported = SUPPORTED_NETWORKS[chainId];

    return {
      isValid: !!supported,
      networkName: supported?.name || `Unknown Network (ID: ${chainId})`,
      chainId,
      explorerUrl: supported?.explorer,
      rpcUrl: supported?.rpcUrl,
      allowedNetworks: Object.values(SUPPORTED_NETWORKS).map((value) => value.name)
    };
  } catch (error) {
    console.error('Network validation failed:', error);
    return {
      isValid: false,
      networkName: 'Unknown',
      chainId: null,
      explorerUrl: null,
      rpcUrl: null,
      allowedNetworks: Object.values(SUPPORTED_NETWORKS).map((value) => value.name),
      error: error.message
    };
  }
};

export const getNetworkName = (chainId) => {
  const id = Number(chainId);
  return SUPPORTED_NETWORKS[id]?.name || `Unknown (ID: ${id})`;
};

export const getExplorerUrl = (chainId, address) => {
  const network = SUPPORTED_NETWORKS[Number(chainId)];
  if (!network?.explorer || !address) return null;
  return `${network.explorer}/address/${address}`;
};

export const formatAddress = (value, chars = 6) => {
  if (!value || typeof value !== 'string') return '';
  if (value.length <= chars * 2 + 3) return value;
  return `${value.slice(0, chars)}...${value.slice(-chars)}`;
};

export const formatEth = (wei, decimals = 4) => {
  try {
    const eth = ethers.formatEther(wei);
    return Number.parseFloat(eth).toFixed(decimals);
  } catch {
    return '0.0000';
  }
};

export const parseEth = (eth) => {
  try {
    return ethers.parseEther(eth.toString());
  } catch (error) {
    console.error('Failed to parse ETH:', error);
    return 0n;
  }
};

export const parseEscrowCreatedEvent = (receipt, factoryInterface) => {
  try {
    const eventFragment = factoryInterface.getEvent('EscrowCreated');

    if (eventFragment?.topicHash) {
      const eventLog = receipt.logs?.find(
        (log) => log.topics?.[0]?.toLowerCase() === eventFragment.topicHash.toLowerCase()
      );

      if (eventLog) {
        return factoryInterface.parseLog(eventLog);
      }
    }

    for (const log of receipt.logs || []) {
      try {
        const parsed = factoryInterface.parseLog(log);
        if (parsed?.name === 'EscrowCreated') {
          return parsed;
        }
      } catch {
        continue;
      }
    }

    return null;
  } catch (error) {
    console.warn('Failed to parse EscrowCreated event:', error);
    return null;
  }
};

export const getContractInstance = (providerOrSigner, address, abi) =>
  new ethers.Contract(address, abi, providerOrSigner);

export const getFactoryAddressForChain = (chainId) => {
  const numericChainId = Number(chainId);
  const artifactAddress = DEPLOYED_FACTORY_ADDRESSES[numericChainId];
  const localFallback = LOCAL_NETWORK_IDS.map((id) => DEPLOYED_FACTORY_ADDRESSES[id]).find(Boolean);

  if (LOCAL_NETWORK_IDS.includes(numericChainId)) {
    return artifactAddress || localFallback || FACTORY_ADDRESS || '';
  }

  return artifactAddress || FACTORY_ADDRESS || '';
};

export const getFactoryContract = async (providerOrSigner, chainId) =>
  getContractInstance(providerOrSigner, getFactoryAddressForChain(chainId), FACTORY_ABI);

export const getEscrowContract = (providerOrSigner, address) =>
  getContractInstance(providerOrSigner, address, ESCROW_ABI);

export const EscrowState = {
  AWAITING_PAYMENT: 0,
  AWAITING_DELIVERY: 1,
  COMPLETE: 2,
  DISPUTED: 3,
  REFUNDED: 4
};

export const getStateName = (stateCode) => {
  const states = {
    0: 'Awaiting Payment',
    1: 'Awaiting Delivery',
    2: 'Complete',
    3: 'Disputed',
    4: 'Refunded'
  };

  return states[stateCode] || `Unknown (${stateCode})`;
};

export const getStateColor = (stateCode) => {
  const colors = {
    0: 'yellow',
    1: 'blue',
    2: 'green',
    3: 'red',
    4: 'gray'
  };

  return colors[stateCode] || 'gray';
};

export default {
  FACTORY_ADDRESS,
  FACTORY_ABI,
  ESCROW_ABI,
  DEPLOYED_FACTORY_ADDRESSES,
  SUPPORTED_NETWORKS,
  EscrowState,
  validateNetwork,
  getNetworkName,
  getExplorerUrl,
  formatAddress,
  formatEth,
  parseEth,
  parseEscrowCreatedEvent,
  getContractInstance,
  getFactoryAddressForChain,
  getFactoryContract,
  getEscrowContract,
  getStateName,
  getStateColor
};
