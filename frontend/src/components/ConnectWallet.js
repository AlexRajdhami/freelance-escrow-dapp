import React from 'react';

function ConnectWallet({ account, onConnect }) {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Freelance Escrow DApp</h1>
      <p style={styles.subtitle}>Secure payments on the blockchain</p>
      {!account ? (
        <button style={styles.button} onClick={onConnect}>
          Connect MetaMask
        </button>
      ) : (
        <div style={styles.accountBox}>
          <span style={styles.dot}></span>
          Connected: {account.slice(0, 6)}...{account.slice(-4)}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { textAlign: 'center', padding: '2rem' },
  title: { fontSize: '2rem', color: '#2d3748' },
  subtitle: { color: '#718096', marginBottom: '1.5rem' },
  button: {
    background: '#4f46e5', color: 'white', border: 'none',
    padding: '0.75rem 2rem', borderRadius: '8px',
    fontSize: '1rem', cursor: 'pointer'
  },
  accountBox: {
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    background: '#f0fdf4', border: '1px solid #86efac',
    padding: '0.5rem 1rem', borderRadius: '8px', color: '#166534'
  },
  dot: {
    width: '8px', height: '8px', borderRadius: '50%',
    background: '#22c55e', display: 'inline-block'
  }
};

export default ConnectWallet;