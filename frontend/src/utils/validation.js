// frontend/src/utils/validation.js
import { ethers } from 'ethers';

export const isValidEthereumAddress = (address) => {
  if (!address || typeof address !== 'string') return false;
  try {
    return ethers.isAddress(address.trim());
  } catch {
    return false;
  }
};

export const isValidAmount = (amount) => {
  if (!amount) return false;
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0.001 && num <= 100; // Reasonable limits
};

export const isValidJobDescription = (desc) => {
  if (!desc || typeof desc !== 'string') return false;
  const trimmed = desc.trim();
  return trimmed.length >= 10 && trimmed.length <= 500;
};

export const validateEscrowForm = (freelancer, jobDesc) => {
  const errors = {};
  
  if (!isValidEthereumAddress(freelancer)) {
    errors.freelancer = 'Invalid Ethereum address format';
  }
  
  if (!isValidJobDescription(jobDesc)) {
    if (!jobDesc?.trim()) {
      errors.jobDesc = 'Job description is required';
    } else if (jobDesc.trim().length < 10) {
      errors.jobDesc = 'Must be at least 10 characters';
    } else if (jobDesc.trim().length > 500) {
      errors.jobDesc = 'Must be under 500 characters';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateDepositForm = (amount) => {
  if (!isValidAmount(amount)) {
    return {
      isValid: false,
      error: 'Amount must be between 0.001 and 100 ETH'
    };
  }
  return { isValid: true, error: null };
};