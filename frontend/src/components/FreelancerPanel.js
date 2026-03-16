import React, { useState } from 'react';
import { ethers } from 'ethers';
import { ESCROW_ABI } from '../utils/contractConfig';

function FreelancerPanel({ provider }) {
  const [escrowAddress, setEscrowAddress] = useState('');
  const [escrowInfo, setEscrowInfo]       = useState(null);
  const [status, setStatus]               = useState('');
  const [loading, setLoading]             = useState(false);

  const signer = provider.getSigner();

  const loadEscrow = async () => {
    try {
      setLoading(true);
      const escrow = new ethers.Contract(escrowAddress, ESCROW_ABI, signer);
      const [client, freelancer, amount, state, jobDesc] = await Promise.all([
        escrow.client(),
        escrow.freelancer(),
        escrow.amount(),
        escrow.currentState(),
        escrow.jobDescription()
      ]);
      const states = ['Awaiting Payment','Awaiting Delivery','Complete','Disputed','Refunded'];
      setEscrowInfo({
        client, freelancer, jobDesc,
        amount: ethers.formatEther(amount) + ' ETH',
        state: states[Number(state)]
      });
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const submitWork = async () => {
    try {
      setLoading(true);
      setStatus('Submitting work...');
      const escrow = new ethers.Contract(escrowAddress, ESCROW_ABI, signer);
      const tx = await escrow.submitWork();
      await tx.wait();
      setStatus('Work submitted successfully!');
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.panel}>
      <h2 style={styles.heading}>Freelancer Panel</h2>

      <div style={styles.section}>
        <input style={styles.input} placeholder="Escrow contract address (0x...)"
          value={escrowAddress} onChange={e => setEscrowAddress(e.target.value)} />
        <button style={styles.btn} onClick={loadEscrow} disabled={loading}>
          Load Escrow
        </button>
      </div>

      {escrowInfo && (
        <div style={styles.infoBox}>
          <p><strong>Job:</strong> {escrowInfo.jobDesc}</p>
          <p><strong>Client:</strong> {escrowInfo.client.slice(0,10)}...</p>
          <p><strong>Amount:</strong> {escrowInfo.amount}</p>
          <p><strong>Status:</strong> <span style={styles.badge}>{escrowInfo.state}</span></p>
          <button style={{...styles.btn, marginTop:'1rem'}} onClick={submitWork} disabled={loading}>
            Submit Work
          </button>
        </div>
      )}

      {status && <div style={styles.status}>{status}</div>}
    </div>
  );
}

const styles = {
  panel: { background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  heading: { color: '#065f46', borderBottom: '2px solid #a7f3d0', paddingBottom: '0.5rem' },
  section: { marginBottom: '1.5rem' },
  input: { display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.5rem',
    border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box' },
  btn: { background: '#059669', color: 'white', border: 'none', padding: '0.6rem 1.2rem',
    borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' },
  infoBox: { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '1rem' },
  badge: { background: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: '4px', fontSize: '0.85rem' },
  status: { background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px',
    padding: '0.75rem', color: '#0369a1', fontSize: '0.85rem', marginTop: '1rem' }
};

export default FreelancerPanel;