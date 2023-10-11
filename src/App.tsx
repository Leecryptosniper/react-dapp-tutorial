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
  const [hasprovider, setHasprovider] = useState<boolean | null>(null);
  const initialState: Wallet = { accounts: [], balance: "", chainId: "" };
  const [wallet, setWallet] = useState<Wallet>(initialState);

  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const refreshAccounts = (accounts: string[]) => {
      if (accounts.length > 0) {
        updateWallet(accounts);
      } else {
        setWallet(initialState);
      }
    };

    const refreshChain = (chainId: string) => {
      setWallet((wallet) => ({ ...wallet, chainId }));
    };

    const getprovider = async () => {
      const provider = await detectEthereumprovider({ silent: true });
      setHasprovider(Boolean(provider));

      if (provider) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        refreshAccounts(accounts);
        window.ethereum.on('accountsChanged', refreshAccounts);
        window.ethereum.on("chainChanged", refreshChain);
      }
    };

    getprovider();

    return () => {
      window.ethereum?.removeListener('accountsChanged', refreshAccounts);
      window.ethereum?.removeListener("chainChanged", refreshChain);
    };
  }, []);

  const updateWallet = async (accounts: string[]) => {
    const balance = formatBalance(await window.ethereum!.request({
      method: "eth_getBalance",
      params: [accounts[0], "latest"],
    }));
    const chainId = await window.ethereum!.request({
      method: "eth_chainId",
    });
    setWallet({ accounts, balance, chainId });
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      }) as string[];
      setError(false);
      updateWallet(accounts);
    } catch (err) {
      setError(true);
      setErrorMessage((err as Error).message);
    }
    setIsConnecting(false);
  };

  const handleApproveSpending = async () => {
    try {
      await window.ethereum.enable();
      const provider = new Web3Provider(window.ethereum);
      const signer: Signer = provider.getSigner();
  
      const contractAddress = '0xYourContractAddress';
      const contractABI: any[] = []; // Your smart contract ABI
      const contract = new Contract(contractAddress, contractABI, signer);
  
      const spender = '0xSpenderContractAddress';
      const allowance = ethers.utils.parseUnits('100', 'ether');
      const tx = await contract.approve(spender, allowance);
      await tx.wait();
  
      console.log('Approval successful.');
    } catch (error) {
      console.error('Error approving spending:', error);
    }
  };
  
    const disableConnect = Boolean(wallet) && isConnecting;

  return (
    <div className="App">
      <div>Injected provider {hasprovider ? 'DOES' : 'DOES NOT'} Exist</div>

      {window.ethereum?.isMetaMask && wallet.accounts.length < 1 &&
        <button disabled={disableConnect} onClick={handleConnect}>Connect MetaMask</button>}

      {wallet.accounts.length > 0 &&
        <>
          <div>Wallet Accounts: {wallet.accounts[0]}</div>
          <div>Wallet Balance: {wallet.balance}</div>
          <div>Hex ChainId: {wallet.chainId}</div>
          <div>Numeric ChainId: {formatChainAsNum(wallet.chainId)}</div>
        </>}
      {error &&
        <div onClick={() => setError(false)}>
          <strong>Error:</strong> {errorMessage}
        </div>}

      <button onClick={handleApproveSpending}>Approve Spending</button>
    </div>
  );
}

export default App;
