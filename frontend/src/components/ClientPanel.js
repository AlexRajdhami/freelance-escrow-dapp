// frontend/src/components/ClientPanel.js
import React, { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { 
  FACTORY_ABI, 
  ESCROW_ABI,
  validateNetwork,
  formatAddress,
  parseEscrowCreatedEvent,
  getFactoryAddressForChain
} from '../utils/contractConfig';
import { uploadJobMetadata } from '../utils/ipfs';
import { validateEscrowForm, validateDepositForm } from '../utils/validation';

function ClientPanel({ provider, account }) {
  const [freelancer, setFreelancer] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [escrowAddress, setEscrowAddress] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [networkInfo, setNetworkInfo] = useState(null);
  const [createdEscrows, setCreatedEscrows] = useState([]);

  // Check network on mount and when provider changes
  React.useEffect(() => {
    const checkNetwork = async () => {
      if (provider) {
        try {
          const result = await validateNetwork(provider);
          setNetworkInfo(result);
          if (!result.isValid) {
            setStatus(`⚠️ Please switch to ${result.allowedNetworks.join(' or ')}`);
          }
        } catch (err) {
          console.error('Network check failed:', err);
        }
      }
    };
    checkNetwork();
  }, [provider]);

  // Clear status message after delay
  const clearStatus = useCallback((delay = 5000) => {
    setTimeout(() => setStatus(''), delay);
  }, []);

  // Create new escrow contract
  const createEscrow = async () => {
    // Validate network
    if (networkInfo && !networkInfo.isValid) {
      setStatus(`⚠️ Wrong network. Please switch to ${networkInfo.allowedNetworks.join(' or ')}`);
      return;
    }

    // Validate form inputs
    const { isValid, errors } = validateEscrowForm(freelancer, jobDesc);
    if (!isValid) {
      setStatus(`⚠️ ${Object.values(errors)[0]}`);
      clearStatus();
      return;
    }

    if (account && freelancer.trim().toLowerCase() === account.toLowerCase()) {
      setStatus('❌ Client cannot be the same as freelancer. Use a different Ganache or MetaMask account.');
      clearStatus();
      return;
    }

    try {
      setLoading(true);
      setStatus('📦 Preparing job metadata...');
      
      // Prepare metadata for IPFS
      const jobMetadata = {
        description: jobDesc.trim(),
        client: account,
        freelancer: freelancer.trim(),
        createdAt: new Date().toISOString(),
        timestamp: Date.now(),
        version: '1.0'
      };
      
      // Upload to IPFS (with fallback for local testing)
      setStatus('📤 Uploading to IPFS...');
      let ipfsHash;
      try {
        ipfsHash = await uploadJobMetadata(jobMetadata);
        setStatus(`✅ Stored on IPFS: ${formatAddress(ipfsHash, 12)}`);
      } catch (ipfsError) {
        console.warn('IPFS upload failed, using fallback:', ipfsError);
        ipfsHash = `QmFallback${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
        setStatus(`⚠️ Using fallback storage: ${formatAddress(ipfsHash, 12)}`);
      }
      
      // Create escrow on blockchain
      setStatus('🔗 Creating escrow on blockchain...');
      
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();
      const factoryAddress = getFactoryAddressForChain(network.chainId);

      if (!factoryAddress || !ethers.isAddress(factoryAddress)) {
        throw new Error('Factory contract is not configured for the current network');
      }

      const factoryCode = await provider.getCode(factoryAddress);
      if (!factoryCode || factoryCode === '0x') {
        throw new Error('No factory contract found at the configured address for this network');
      }

      const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, signer);
      
      // Send transaction
      const tx = await factory.createEscrow(freelancer.trim(), ipfsHash);
      setStatus('⏳ Transaction submitted, waiting for confirmation...');
      
      // Wait for confirmation
      const receipt = await tx.wait();
      setStatus('✅ Transaction confirmed! Processing...');
      
      // Parse EscrowCreated event to get new escrow address
      let newAddress = null;
      
      // Method 1: Use topic hash (most reliable)
      const eventTopic = factory.interface.getEvent('EscrowCreated')?.topicHash;
      
      if (eventTopic) {
        const eventLog = receipt.logs?.find(log => 
          log.topics?.[0]?.toLowerCase() === eventTopic.toLowerCase()
        );
        
        if (eventLog) {
          try {
            const parsed = factory.interface.parseLog(eventLog);
            newAddress = parsed.args.escrowAddress;
          } catch (e) {
            console.warn('Event parse failed, trying fallback...', e);
          }
        }
      }
      
      // Method 2: Iterate through all logs (fallback)
      if (!newAddress && receipt.logs) {
        for (const log of receipt.logs) {
          try {
            const parsed = factory.interface.parseLog(log);
            if (parsed?.name === 'EscrowCreated') {
              newAddress = parsed.args.escrowAddress;
              break;
            }
          } catch {
            continue;
          }
        }
      }
      
      // Method 3: Use helper function from contractConfig
      if (!newAddress) {
        const event = parseEscrowCreatedEvent(receipt, factory.interface);
        if (event) {
          newAddress = event.args.escrowAddress;
        }
      }

      // Method 4: Read the newest escrow back from the factory if supported
      if (!newAddress) {
        try {
          const allEscrows = await factory.getAllEscrows();
          if (Array.isArray(allEscrows) && allEscrows.length > 0) {
            newAddress = allEscrows[allEscrows.length - 1];
          }
        } catch (lookupError) {
          console.warn('Factory lookup fallback failed:', lookupError);
        }
      }
      
      // Update state if successful
      if (newAddress && ethers.isAddress(newAddress)) {
        setEscrowAddress(newAddress);
        setCreatedEscrows(prev => [...prev, {
          address: newAddress,
          freelancer: freelancer.trim(),
          jobDesc: jobDesc.trim(),
          ipfsHash,
          createdAt: new Date().toISOString()
        }]);
        
        setStatus(`🎉 Success!\n📋 Escrow: ${formatAddress(newAddress)}\n🔗 IPFS: ${formatAddress(ipfsHash, 12)}\n👤 Freelancer: ${formatAddress(freelancer.trim())}`);
        
        // Clear form
        setFreelancer('');
        setJobDesc('');
        clearStatus(8000);
      } else {
        setStatus('⚠️ Escrow created but address not detected. Check Ganache for the address in the EscrowCreated event.');
        clearStatus();
      }
      
    } catch (err) {
      console.error('Create escrow error:', err);
      
      // User-friendly error messages
      let errorMsg = err.reason || err.message || 'Unknown error';
      if (errorMsg.includes('insufficient funds')) {
        errorMsg = '❌ Insufficient ETH for gas. Get test ETH from faucet.';
      } else if (errorMsg.includes('user rejected')) {
        errorMsg = '❌ Transaction cancelled by user.';
      } else if (errorMsg.includes('invalid address')) {
        errorMsg = '❌ Invalid freelancer address format.';
      } else if (errorMsg.includes('Client cannot be freelancer')) {
        errorMsg = '❌ Client cannot be the same as freelancer.';
      } else if (errorMsg.includes('missing revert data')) {
        errorMsg = '❌ Transaction reverted. Most likely the freelancer address matches the connected client account.';
      } else if (errorMsg.includes('Factory contract is not configured')) {
        errorMsg = '❌ Deploy the factory for this network or set REACT_APP_FACTORY_ADDRESS.';
      } else if (errorMsg.includes('No factory contract found')) {
        errorMsg = '❌ The configured factory address has no contract on this network. Redeploy and update the frontend address.';
      }
      
      setStatus(errorMsg);
      clearStatus();
      
    } finally {
      setLoading(false);
    }
  };

  // Deposit funds into escrow
  const depositFunds = async () => {
    if (!escrowAddress || !ethers.isAddress(escrowAddress)) {
      setStatus('⚠️ Please enter a valid escrow contract address');
      clearStatus();
      return;
    }

    const { isValid, error } = validateDepositForm(amount);
    if (!isValid) {
      setStatus(`⚠️ ${error}`);
      clearStatus();
      return;
    }

    try {
      setLoading(true);
      setStatus('💰 Depositing funds...');
      
      const signer = await provider.getSigner();
      const escrow = new ethers.Contract(escrowAddress, ESCROW_ABI, signer);
      
      // Parse ETH amount and send transaction
      const value = ethers.parseEther(amount);
      const tx = await escrow.deposit({ value });
      
      setStatus('⏳ Confirming deposit...');
      await tx.wait();
      
      setStatus(`✅ Deposited ${amount} ETH successfully!`);
      setAmount('');
      clearStatus();
      
    } catch (err) {
      console.error('Deposit error:', err);
      const errorMsg = err.reason || err.message || 'Deposit failed';
      setStatus(`❌ ${errorMsg}`);
      clearStatus();
    } finally {
      setLoading(false);
    }
  };

  // Release funds to freelancer
  const releaseFunds = async () => {
    if (!escrowAddress || !ethers.isAddress(escrowAddress)) {
      setStatus('⚠️ Please enter a valid escrow contract address');
      return;
    }

    try {
      setLoading(true);
      setStatus('🔄 Releasing funds...');
      
      const signer = await provider.getSigner();
      const escrow = new ethers.Contract(escrowAddress, ESCROW_ABI, signer);
      
      const tx = await escrow.releaseFunds();
      await tx.wait();
      
      setStatus('✅ Funds released to freelancer!');
      clearStatus();
      
    } catch (err) {
      console.error('Release error:', err);
      const errorMsg = err.reason || err.message || 'Release failed';
      setStatus(`❌ ${errorMsg}`);
      clearStatus();
    } finally {
      setLoading(false);
    }
  };

  // Raise dispute
  const raiseDispute = async () => {
    if (!escrowAddress || !ethers.isAddress(escrowAddress)) {
      setStatus('⚠️ Please enter a valid escrow contract address');
      return;
    }

    try {
      setLoading(true);
      setStatus('⚖️ Raising dispute...');
      
      const signer = await provider.getSigner();
      const escrow = new ethers.Contract(escrowAddress, ESCROW_ABI, signer);
      
      const tx = await escrow.raiseDispute();
      await tx.wait();
      
      setStatus('✅ Dispute raised! Arbitrator will review.');
      clearStatus();
      
    } catch (err) {
      console.error('Dispute error:', err);
      const errorMsg = err.reason || err.message || 'Dispute failed';
      setStatus(`❌ ${errorMsg}`);
      clearStatus();
    } finally {
      setLoading(false);
    }
  };

  // Copy address to clipboard
  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus(`📋 ${label} copied to clipboard!`);
      clearStatus(2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <div style={styles.panel}>
      <h2 style={styles.heading}>👤 Client Panel</h2>
      
      {/* Network Status Badge */}
      {networkInfo && (
        <div style={{
          ...styles.networkBadge,
          background: networkInfo.isValid ? '#dcfce7' : '#fef2f2',
          color: networkInfo.isValid ? '#166534' : '#dc2626',
          border: networkInfo.isValid ? '1px solid #86efac' : '1px solid #fecaca'
        }}>
          {networkInfo.isValid ? '✅' : '⚠️'} {networkInfo.networkName}
          {networkInfo.isValid && networkInfo.chainId && (
            <span style={{marginLeft: '0.5rem', opacity: 0.7}}>(ID: {networkInfo.chainId})</span>
          )}
        </div>
      )}
      
      {/* Account Info */}
      {account && (
        <div style={styles.accountInfo}>
          <span style={{fontSize: '0.85rem', color: '#6b7280'}}>Connected:</span>
          <span style={{fontSize: '0.85rem', fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px'}}>
            {formatAddress(account)}
          </span>
          <button 
            onClick={() => copyToClipboard(account, 'Address')}
            style={styles.copyBtn}
            title="Copy address"
          >
            📋
          </button>
        </div>
      )}
      
      {/* Create New Escrow Section */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>🚀 Create New Escrow</h3>
        
        <input 
          style={styles.input} 
          placeholder="Freelancer address (0x...)"
          value={freelancer} 
          onChange={e => setFreelancer(e.target.value)} 
          disabled={loading}
          aria-label="Freelancer Ethereum address"
        />
        
        <textarea 
          style={{...styles.input, minHeight: '80px', resize: 'vertical', fontFamily: 'inherit'}}
          placeholder="Job description (10-500 characters)"
          value={jobDesc} 
          onChange={e => setJobDesc(e.target.value)}
          disabled={loading}
          maxLength={500}
          aria-label="Job description"
        />
        <div style={styles.charCount}>{jobDesc.length}/500</div>
        
        <button 
          style={{
            ...styles.btn, 
            ...(loading ? styles.btnDisabled : {}),
            width: '100%',
            marginTop: '0.5rem'
          }} 
          onClick={createEscrow} 
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? '⏳ Creating Escrow...' : '🚀 Create Escrow'}
        </button>
      </div>
      
      {/* Manage Escrow Section */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>💼 Manage Escrow</h3>
        
        <input 
          style={styles.input} 
          placeholder="Escrow contract address (0x...)"
          value={escrowAddress} 
          onChange={e => setEscrowAddress(e.target.value)}
          disabled={loading}
          aria-label="Escrow contract address"
        />
        
        <input 
          style={styles.input} 
          placeholder="Amount in ETH (e.g., 0.1)"
          value={amount} 
          onChange={e => setAmount(e.target.value)}
          disabled={loading}
          type="number"
          step="0.001"
          min="0.001"
          aria-label="Deposit amount in ETH"
        />
        
        <div style={styles.btnRow}>
          <button 
            style={{...styles.btn, ...(loading ? styles.btnDisabled : {})}} 
            onClick={depositFunds} 
            disabled={loading}
          >
            💰 Deposit
          </button>
          <button 
            style={{...styles.btn, background:'#22c55e', ...(loading ? styles.btnDisabled : {})}} 
            onClick={releaseFunds} 
            disabled={loading}
          >
            ✅ Release
          </button>
          <button 
            style={{...styles.btn, background:'#ef4444', ...(loading ? styles.btnDisabled : {})}} 
            onClick={raiseDispute} 
            disabled={loading}
          >
            ⚖️ Dispute
          </button>
        </div>
      </div>
      
      {/* Created Escrows History */}
      {createdEscrows.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>📜 Recent Escrows</h3>
          <div style={styles.escrowList}>
            {createdEscrows.slice(-3).reverse().map((escrow, index) => (
              <div key={index} style={styles.escrowItem}>
                <div style={styles.escrowAddress}>
                  <span style={{fontFamily: 'monospace', fontSize: '0.85rem'}}>
                    {formatAddress(escrow.address)}
                  </span>
                  <button 
                    onClick={() => {
                      setEscrowAddress(escrow.address);
                      setStatus('📋 Escrow address loaded!');
                      clearStatus(2000);
                    }}
                    style={styles.loadBtn}
                    title="Load this escrow"
                  >
                    Load
                  </button>
                </div>
                <div style={styles.escrowDetails}>
                  <span style={{fontSize: '0.8rem', color: '#6b7280'}}>
                    {escrow.jobDesc.substring(0, 40)}...
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Status Message */}
      {status && (
        <div style={{
          ...styles.status,
          background: status.includes('Error') || status.includes('❌') ? '#fef2f2' : 
                     status.includes('✅') || status.includes('🎉') ? '#f0fdf4' : '#f0f9ff',
          border: status.includes('Error') || status.includes('❌') ? '1px solid #fecaca' : 
                  status.includes('✅') || status.includes('🎉') ? '1px solid #86efac' : '1px solid #bae6fd',
          color: status.includes('Error') || status.includes('❌') ? '#dc2626' : 
                 status.includes('✅') || status.includes('🎉') ? '#166534' : '#0369a1'
        }}>
          {status}
        </div>
      )}
      
      {/* Help Tips */}
      <div style={styles.helpText}>
        <strong>💡 Tips:</strong>
        <ul style={{margin: '0.5rem 0 0 1rem', paddingLeft: '0.5rem'}}>
          <li>Ensure MetaMask is connected to Ganache (Chain ID: 1337) or Sepolia</li>
          <li>Have test ETH for gas fees</li>
          <li>Job descriptions are stored on IPFS for decentralization</li>
          <li>Copy escrow addresses to share with freelancers</li>
        </ul>
      </div>
    </div>
  );
}

const styles = {
  panel: { 
    background: '#fff', 
    borderRadius: '12px', 
    padding: '1.5rem', 
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
    maxWidth: '600px',
    margin: '0 auto',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  heading: { 
    color: '#1e40af', 
    borderBottom: '2px solid #bfdbfe', 
    paddingBottom: '0.75rem',
    margin: '0 0 1rem 0',
    fontSize: '1.25rem',
    fontWeight: '600'
  },
  accountInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1rem',
    padding: '0.5rem',
    background: '#f8fafc',
    borderRadius: '6px',
    fontSize: '0.85rem'
  },
  copyBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    padding: '2px',
    opacity: 0.7,
    transition: 'opacity 0.2s'
  },
  networkBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    borderRadius: '9999px',
    fontSize: '0.875rem',
    fontWeight: '500',
    marginBottom: '1rem'
  },
  section: { 
    marginBottom: '1.5rem',
    padding: '1rem',
    background: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  },
  sectionTitle: { 
    color: '#374151', 
    fontSize: '1rem', 
    marginBottom: '0.75rem',
    margin: '0 0 0.5rem 0',
    fontWeight: '600'
  },
  input: { 
    display: 'block', 
    width: '100%', 
    padding: '0.75rem', 
    marginBottom: '0.5rem',
    border: '1px solid #d1d5db', 
    borderRadius: '8px', 
    fontSize: '0.95rem', 
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    outline: 'none'
  },
  charCount: {
    textAlign: 'right',
    fontSize: '0.75rem',
    color: '#6b7280',
    marginTop: '-0.25rem',
    marginBottom: '0.5rem'
  },
  btn: { 
    background: '#4f46e5', 
    color: 'white', 
    border: 'none', 
    padding: '0.75rem 1.5rem',
    borderRadius: '8px', 
    cursor: 'pointer', 
    fontSize: '0.95rem',
    fontWeight: '500',
    transition: 'background 0.2s, transform 0.1s',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem'
  },
  btnDisabled: {
    opacity: 0.6, 
    cursor: 'not-allowed',
    background: '#9ca3af'
  },
  btnRow: { 
    display: 'flex', 
    flexWrap: 'wrap', 
    gap: '0.5rem',
    marginTop: '0.75rem'
  },
  escrowList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  escrowItem: {
    background: '#fff',
    padding: '0.75rem',
    borderRadius: '6px',
    border: '1px solid #e2e8f0'
  },
  escrowAddress: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.25rem'
  },
  loadBtn: {
    background: '#4f46e5',
    color: 'white',
    border: 'none',
    padding: '0.25rem 0.75rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    cursor: 'pointer'
  },
  escrowDetails: {
    fontSize: '0.8rem',
    color: '#6b7280'
  },
  status: { 
    background: '#f0f9ff', 
    border: '1px solid #bae6fd', 
    borderRadius: '8px',
    padding: '0.875rem', 
    fontSize: '0.9rem', 
    wordBreak: 'break-word',
    marginTop: '1rem',
    whiteSpace: 'pre-line',
    animation: 'fadeIn 0.3s ease'
  },
  helpText: {
    fontSize: '0.85rem',
    color: '#6b7280',
    marginTop: '1.5rem',
    padding: '0.75rem',
    background: '#f1f5f9',
    borderRadius: '6px',
    borderLeft: '3px solid #4f46e5'
  }
};

export default ClientPanel;
