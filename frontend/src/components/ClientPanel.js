import React, { useState } from 'react';
import { ethers } from 'ethers';
import { FACTORY_ADDRESS, FACTORY_ABI, ESCROW_ABI } from '../utils/contractConfig';

function ClientPanel({ provider, account }) {
  const [freelancer, setFreelancer]   = useState('');
  const [jobDesc, setJobDesc]         = useState('');
  const [amount, setAmount]           = useState('');
  const [escrowAddress, setEscrowAddress] = useState('');
  const [status, setStatus]           = useState('');
  const [loading, setLoading]         = useState(false);

  const signer = provider.getSigner();

  const createEscrow = async () => {
    try {
      setLoading(true);
      setStatus('Creating escrow...');
      const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);
      const tx = await factory.createEscrow(freelancer, jobDesc);
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try { return factory.interface.parseLog(log).name === 'EscrowCreated'; }
        catch { return false; }
      });
      const parsed = factory.interface.parseLog(event);
      const newAddress = parsed.args.escrowAddress;
      setEscrowAddress(newAddress);
      setStatus(`Escrow created at: ${newAddress}`);
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const depositFunds = async () => {
    try {
      setLoading(true);
      setStatus('Depositing funds...');
      const escrow = new ethers.Contract(escrowAddress, ESCROW_ABI, signer);
      const tx = await escrow.deposit({ value: ethers.parseEther(amount) });
      await tx.wait();
      setStatus(`Deposited ${amount} ETH successfully!`);
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const releaseFunds = async () => {
    try {
      setLoading(true);
      setStatus('Releasing funds...');
      const escrow = new ethers.Contract(escrowAddress, ESCROW_ABI, signer);
      const tx = await escrow.releaseFunds();
      await tx.wait();
      setStatus('Funds released to freelancer!');
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const raiseDispute = async () => {
    try {
      setLoading(true);
      setStatus('Raising dispute...');
      const escrow = new ethers.Contract(escrowAddress, ESCROW_ABI, signer);
      const tx = await escrow.raiseDispute();
      await tx.wait();
      setStatus('Dispute raised successfully!');
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.panel}>
      <h2 style={styles.heading}>Client Panel</h2>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Create New Escrow</h3>
        <input style={styles.input} placeholder="Freelancer address (0x...)"
          value={freelancer} onChange={e => setFreelancer(e.target.value)} />
        <input style={styles.input} placeholder="Job description"
          value={jobDesc} onChange={e => setJobDesc(e.target.value)} />
        <button style={styles.btn} onClick={createEscrow} disabled={loading}>
          Create Escrow
        </button>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Manage Escrow</h3>
        <input style={styles.input} placeholder="Escrow contract address (0x...)"
          value={escrowAddress} onChange={e => setEscrowAddress(e.target.value)} />
        <input style={styles.input} placeholder="Amount in ETH"
          value={amount} onChange={e => setAmount(e.target.value)} />
        <div style={styles.btnRow}>
          <button style={styles.btn} onClick={depositFunds} disabled={loading}>
            Deposit Funds
          </button>
          <button style={{...styles.btn, background:'#22c55e'}} onClick={releaseFunds} disabled={loading}>
            Release Funds
          </button>
          <button style={{...styles.btn, background:'#ef4444'}} onClick={raiseDispute} disabled={loading}>
            Raise Dispute
          </button>
        </div>
      </div>

      {status && <div style={styles.status}>{status}</div>}
    </div>
  );
}

const styles = {
  panel: { background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  heading: { color: '#1e40af', borderBottom: '2px solid #bfdbfe', paddingBottom: '0.5rem' },
  section: { marginBottom: '1.5rem' },
  sectionTitle: { color: '#374151', fontSize: '1rem', marginBottom: '0.75rem' },
  input: { display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.5rem',
    border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box' },
  btn: { background: '#4f46e5', color: 'white', border: 'none', padding: '0.6rem 1.2rem',
    borderRadius: '6px', cursor: 'pointer', marginRight: '0.5rem', fontSize: '0.9rem' },
  btnRow: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' },
  status: { background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px',
    padding: '0.75rem', color: '#0369a1', fontSize: '0.85rem', wordBreak: 'break-all' }
};

export default ClientPanel;