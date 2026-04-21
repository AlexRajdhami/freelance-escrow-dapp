import React, { useState } from 'react';
import { ethers } from 'ethers';
import ConnectWallet from './components/ConnectWallet';
import ClientPanel from './components/ClientPanel';
import FreelancerPanel from './components/FreelancerPanel';
import ArbitratorPanel from './components/ArbitratorPanel';

function App() {
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [role, setRole] = useState('client');

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('MetaMask not found! Please install MetaMask.');
      return;
    }
    const web3Provider = new ethers.BrowserProvider(window.ethereum);
    await web3Provider.send('eth_requestAccounts', []);
    const signer = await web3Provider.getSigner();
    const address = await signer.getAddress();
    setProvider(web3Provider);
    setAccount(address);
  };

  return (
    <div style={styles.app}>
      <ConnectWallet account={account} onConnect={connectWallet} />

      {account && (
        <>
          <div style={styles.tabs}>
            {['client','freelancer','arbitrator'].map(r => (
              <button 
                key={r} 
                style={{...styles.tab, ...(role===r ? styles.activeTab : {})}}
                onClick={() => setRole(r)}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          <div style={styles.content}>
            {role === 'client' && <ClientPanel provider={provider} account={account} />}
            {role === 'freelancer' && <FreelancerPanel provider={provider} account={account} />}
            {role === 'arbitrator' && <ArbitratorPanel provider={provider} account={account} />}
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  app: { 
    maxWidth: '800px', 
    margin: '0 auto', 
    padding: '2rem', 
    fontFamily: 'sans-serif', 
    background: '#f8fafc', 
    minHeight: '100vh' 
  },
  tabs: { 
    display: 'flex', 
    gap: '0.5rem', 
    marginBottom: '1.5rem' 
  },
  tab: { 
    padding: '0.6rem 1.5rem', 
    border: '1px solid #d1d5db', 
    borderRadius: '8px',
    background: '#fff', 
    cursor: 'pointer', 
    fontSize: '0.95rem', 
    color: '#374151' 
  },
  activeTab: { 
    background: '#4f46e5', 
    color: '#fff', 
    border: '1px solid #4f46e5' 
  },
  content: { 
    marginTop: '0.5rem' 
  }
};

export default App;