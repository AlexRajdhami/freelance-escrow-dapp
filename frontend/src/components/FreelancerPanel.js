import React, { useState } from 'react';
import { ethers } from 'ethers';
import { ESCROW_ABI } from '../utils/contractConfig';
import { getJobMetadata, isIpfsCid } from '../utils/ipfs';

function FreelancerPanel({ provider }) {
  const [escrowAddress, setEscrowAddress] = useState('');
  const [escrowInfo, setEscrowInfo] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [userAddress, setUserAddress] = useState(null);

  // Get connected user address on mount
  React.useEffect(() => {
    const fetchUser = async () => {
      if (provider) {
        try {
          const signer = await provider.getSigner();
          const addr = await signer.getAddress();
          setUserAddress(addr.toLowerCase());
        } catch (err) {
          console.warn('Could not get signer address');
        }
      }
    };
    fetchUser();
  }, [provider]);

  const loadEscrow = async () => {
    if (!escrowAddress || !ethers.isAddress(escrowAddress)) {
      setStatus('⚠️ Please enter a valid contract address');
      return;
    }

    try {
      setLoading(true);
      setStatus('Loading escrow details...');
      
      const signer = await provider.getSigner();
      const escrow = new ethers.Contract(escrowAddress, ESCROW_ABI, signer);
      
      const [client, freelancer, amount, state, jobDesc] = await Promise.all([
        escrow.client(),
        escrow.freelancer(),
        escrow.amount(),
        escrow.currentState(),
        escrow.jobDescription()
      ]);
      
      const states = ['Awaiting Payment','Awaiting Delivery','Complete','Disputed','Refunded'];
      
      let displayJobDesc = jobDesc;
      let ipfsMetadata = null;
      
      if (isIpfsCid(jobDesc)) {
        try {
          setStatus('📥 Fetching job details from IPFS...');
          const metadata = await getJobMetadata(jobDesc);
          displayJobDesc = metadata.description || jobDesc;
          ipfsMetadata = metadata;
          setStatus('');
        } catch (err) {
          console.warn('⚠️ IPFS fetch failed, showing on-chain fallback');
        }
      }
      
      const stateCode = Number(state);
      const isMyEscrow = freelancer.toLowerCase() === userAddress;
      const canSubmitWork = isMyEscrow && stateCode === 1; // AWAITING_DELIVERY
      
      setEscrowInfo({
        client, 
        freelancer, 
        jobDesc: displayJobDesc,
        ipfsHash: isIpfsCid(jobDesc) ? jobDesc : null,
        ipfsMetadata,
        amount: ethers.formatEther(amount) + ' ETH',
        state: states[stateCode],
        stateCode,
        isMyEscrow,
        canSubmitWork
      });
      
    } catch (err) {
      console.error('Load escrow error:', err);
      setStatus(`❌ Error: ${err.reason || err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const submitWork = async () => {
    if (!escrowAddress || !escrowInfo?.canSubmitWork) {
      setStatus('⚠️ Cannot submit work for this escrow');
      return;
    }

    try {
      setLoading(true);
      setStatus('🔄 Submitting work...');
      
      const signer = await provider.getSigner();
      const escrow = new ethers.Contract(escrowAddress, ESCROW_ABI, signer);
      
      const tx = await escrow.submitWork();
      setStatus('⏳ Waiting for confirmation...');
      await tx.wait();
      
      setStatus('✅ Work submitted successfully!');
      await loadEscrow(); // Refresh UI
      
    } catch (err) {
      console.error('Submit work error:', err);
      const msg = err.reason || err.message || 'Transaction failed';
      setStatus(`❌ Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.panel}>
      <h2 style={styles.heading}>👨‍💻 Freelancer Panel</h2>

      <div style={styles.section}>
        <input 
          style={styles.input} 
          placeholder="Escrow contract address (0x...)"
          value={escrowAddress} 
          onChange={e => setEscrowAddress(e.target.value)}
          disabled={loading}
        />
        <button style={styles.btn} onClick={loadEscrow} disabled={loading}>
          {loading ? '⏳ Loading...' : '🔍 Load Escrow'}
        </button>
      </div>

      {escrowInfo && (
        <div style={styles.infoBox}>
          <p><strong>📋 Job:</strong> {escrowInfo.jobDesc}</p>
          
          {escrowInfo.ipfsHash && (
            <p style={styles.small}>
              <em>🔗 IPFS: <code>{escrowInfo.ipfsHash.slice(0, 16)}...</code></em>
            </p>
          )}
          
          <p><strong>👤 Client:</strong> <code>{escrowInfo.client?.slice(0, 10)}...</code></p>
          <p><strong>👨‍💻 Freelancer:</strong> <code>{escrowInfo.freelancer?.slice(0, 10)}...</code>
            {escrowInfo.isMyEscrow && <span style={styles.youBadge}> (You)</span>}
          </p>
          <p><strong>💰 Amount:</strong> {escrowInfo.amount}</p>
          
          <p><strong>📊 Status:</strong> 
            <span style={{
              ...styles.badge,
              background: getStateColor(escrowInfo.stateCode).bg,
              color: getStateColor(escrowInfo.stateCode).color
            }}>
              {escrowInfo.state}
            </span>
          </p>
          
          {escrowInfo.canSubmitWork && (
            <button 
              style={{...styles.btn, marginTop:'1rem', width: '100%', background: '#059669'}} 
              onClick={submitWork} 
              disabled={loading}
            >
              {loading ? '⏳ Submitting...' : '✅ Submit Work'}
            </button>
          )}
          
          {!escrowInfo.isMyEscrow && (
            <p style={styles.warning}>⚠️ You are not the freelancer for this escrow</p>
          )}
        </div>
      )}

      {status && (
        <div style={{
          ...styles.status,
          background: status.includes('Error') || status.includes('❌') ? '#fef2f2' : '#f0f9ff',
          border: status.includes('Error') || status.includes('❌') ? '1px solid #fecaca' : '1px solid #bae6fd',
          color: status.includes('Error') || status.includes('❌') ? '#dc2626' : '#0369a1'
        }}>
          {status}
        </div>
      )}
    </div>
  );
}

// Helper: State color mapping
const getStateColor = (code) => {
  const colors = {
    0: { bg: '#e0e7ff', color: '#3730a3' },   // Awaiting Payment
    1: { bg: '#fef3c7', color: '#92400e' },   // Awaiting Delivery
    2: { bg: '#d1fae5', color: '#065f46' },   // Complete
    3: { bg: '#fee2e2', color: '#b91c1c' },   // Disputed
    4: { bg: '#f3f4f6', color: '#374151' }    // Refunded
  };
  return colors[code] || colors[0];
};

const styles = {
  panel: { 
    background: '#fff', 
    borderRadius: '12px', 
    padding: '1.5rem', 
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    maxWidth: '600px',
    margin: '0 auto'
  },
  heading: { 
    color: '#065f46', 
    borderBottom: '2px solid #a7f3d0', 
    paddingBottom: '0.5rem',
    margin: '0 0 1rem 0'
  },
  section: { marginBottom: '1.5rem' },
  input: { 
    display: 'block', 
    width: '100%', 
    padding: '0.6rem', 
    marginBottom: '0.5rem',
    border: '1px solid #d1d5db', 
    borderRadius: '6px', 
    fontSize: '0.9rem', 
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  },
  btn: { 
    background: '#059669', 
    color: 'white', 
    border: 'none', 
    padding: '0.6rem 1.2rem',
    borderRadius: '6px', 
    cursor: 'pointer', 
    fontSize: '0.9rem',
    transition: 'background 0.2s'
  },
  infoBox: { 
    background: '#f0fdf4', 
    border: '1px solid #bbf7d0', 
    borderRadius: '8px', 
    padding: '1rem' 
  },
  badge: { 
    padding: '4px 10px', 
    borderRadius: '6px', 
    fontSize: '0.85rem',
    fontWeight: '500',
    display: 'inline-block'
  },
  youBadge: {
    background: '#059669',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    marginLeft: '0.5rem'
  },
  small: { fontSize: '0.8rem', color: '#6b7280', margin: '0.25rem 0' },
  warning: {
    fontSize: '0.85rem',
    color: '#dc2626',
    marginTop: '0.5rem',
    fontStyle: 'italic'
  },
  status: { 
    background: '#f0f9ff', 
    border: '1px solid #bae6fd', 
    borderRadius: '6px',
    padding: '0.75rem', 
    fontSize: '0.85rem', 
    marginTop: '1rem',
    wordBreak: 'break-all'
  }
};

export default FreelancerPanel;