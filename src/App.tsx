import './App.css';
import { Web3Provider } from '@ethersproject/providers';
import { useState, useEffect } from 'react';
import detectEthereumprovider from '@metamask/detect-provider';
import React from 'react';

interface Wallet {
  accounts: string[];
  balance: string;
  chainId: string;
}

function App() {
  const [hasProvider, setHasProvider] = useState<boolean | null>(null);
  const initialState: Wallet = { accounts: [], balance: '0', chainId: '0' }; // Initialize with default values
  const [wallet, setWallet] = useState<Wallet>(initialState);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const refreshAccounts = async () => {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        setWallet((prevWallet) => ({ ...prevWallet, accounts }));
      } catch (err) {
        console.error('Error fetching accounts:', err);
      }
    };

    const refreshChain = async () => {
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        setWallet((prevWallet) => ({ ...prevWallet, chainId }));
      } catch (err) {
        console.error('Error fetching chain ID:', err);
      }
    };

    const getProvider = async () => {
      const provider = await detectEthereumprovider({ silent: true });
      setHasProvider(Boolean(provider));

      if (provider) {
        refreshAccounts();
        refreshChain();

        window.ethereum.on('accountsChanged', refreshAccounts);
        window.ethereum.on('chainChanged', refreshChain);
      }
    };

    getProvider();

    return () => {
      window.ethereum?.removeListener('accountsChanged', refreshAccounts);
      window.ethereum?.removeListener('chainChanged', refreshChain);
    };
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[];
      setWallet((prevWallet) => ({ ...prevWallet, accounts }));
      setError(false);
    } catch (err) {
      setError(true);
      setErrorMessage((err as Error).message);
    }
    setIsConnecting(false);
  };

  const disableConnect = Boolean(wallet.accounts.length) && isConnecting;

  return (
    <div className="App">
      <div>Injected provider {hasProvider ? 'DOES' : 'DOES NOT'} Exist</div>

      {window.ethereum?.isMetaMask && wallet.accounts.length === 0 && (
        <button disabled={disableConnect} onClick={handleConnect}>
          Connect MetaMask
        </button>
      )}

      {wallet.accounts.length > 0 && (
        <>
          <div>Wallet Accounts: {wallet.accounts[0]}</div>
          <div>Wallet Balance: {wallet.balance}</div>
          <div>Hex ChainId: {wallet.chainId}</div>
        </>
      )}

      {error && (
        <div onClick={() => setError(false)}>
          <strong>Error:</strong> {errorMessage}
        </div>
      )}
    </div>
  );
}

export default App;
