import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import './index.css';

const services = [
  { id: 1, name: 'Plumbing', price: 0 },
  { id: 2, name: 'Electrical', price: 0 },
  { id: 3, name: 'Carpentry', price: 0 },
];

function App() {
  const [selectedService, setSelectedService] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({ name: '', address: '', phone: '', email: '' });
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [account, setAccount] = useState(null);
  const [web3, setWeb3] = useState(null);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null); // New state for connection status

  useEffect(() => {
    if (window.ethereum) {
      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);
    }
  }, []);

  const connectMetaMask = async () => {
    if (web3) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0xA9', // 169 in hex
            chainName: 'Manta Pacific Mainnet',
            nativeCurrency: {
              name: 'MANTA',
              symbol: 'MANTA',
              decimals: 18
            },
            rpcUrls: ['https://pacific-rpc.manta.network/http'],
            blockExplorerUrls: ['https://pacific-explorer.manta.network']
          }]
        });

        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        setConnectionStatus(truncateAddress(accounts[0])); // Show truncated wallet address
      } catch (error) {
        console.error('MetaMask connection error:', error);
        setConnectionStatus('Failed to connect to MetaMask. Please try again.'); // Set error status
      }
    }
  };

  const truncateAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`; // Truncate to show first 6 and last 4 characters
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setBookingConfirmed(false);
    setProcessing(false);
    setError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo({ ...customerInfo, [name]: value });
  };

  const handleBooking = async () => {
    if (customerInfo.name && customerInfo.address && customerInfo.phone && customerInfo.email && account) {
      setProcessing(true);
      setError(null);
      try {
        // Check balance
        const balance = await web3.eth.getBalance(account);
        const requiredDeposit = web3.utils.toWei('0', 'ether');
        if (parseFloat(balance) < parseFloat(requiredDeposit)) {
          setError('You need to make a deposit of at least $0 to proceed. Please fund your wallet address on Manta Chain.');
          setProcessing(false);
          return;
        }

        // Proceed with transaction
        await web3.eth.sendTransaction({
          from: account,
          to: '0x829ee0644aa28E6002E357A1F41a6CCBb521fb30', // Address to receive the $0 deposit
          value: requiredDeposit,
        });

        setProcessing(false);
        setBookingConfirmed(true);
      } catch (error) {
        console.error('Transaction error:', error);
        setError('Transaction failed. Please try again.');
        setProcessing(false);
      }
    } else {
      alert('Please fill in all fields and connect a wallet.');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>HandyLink</h1>
        <p>Connecting you with local repair professionals.</p>
      </header>
      <main className="App-main">
        <section className="intro-section">
          <h2>Welcome to HandyLink</h2>
          <p>
            HandyLink is your go-to platform for connecting with professional local repairers such as plumbers, electricians, and carpenters. 
            Our mission is to make it easier for you to find reliable help for your home repair needs.
          </p>
        </section>
        <section className="services-section">
          <h2>Available Services, Connect wallet to contimue</h2>
          <ul className="service-list">
            {services.map((service) => (
              <li key={service.id} className="service-item">
                <button onClick={() => handleServiceSelect(service)} className="service-button">
                  {service.name} - ${service.price}
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section className="wallet-section">
          <h2>{account ? 'Wallet Connected' : 'Connect Wallet'}</h2>
          {!account && (
            <button onClick={connectMetaMask} className="wallet-button">Connect MetaMask</button>
          )}
          {account && (
            <p className="connection-status">Connected: {truncateAddress(account)}</p>
          )}
        </section>
        {selectedService && account && !bookingConfirmed && (
          <section className="booking-section">
            <h2>Book {selectedService.name} Service</h2>
            <div className="booking-form">
              <label>
                Name:
                <input
                  type="text"
                  name="name"
                  value={customerInfo.name}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </label>
              <label>
                Address:
                <input
                  type="text"
                  name="address"
                  value={customerInfo.address}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </label>
              <label>
                Phone:
                <input
                  type="text"
                  name="phone"
                  value={customerInfo.phone}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </label>
              <label>
                Email:
                <input
                  type="email"
                  name="email"
                  value={customerInfo.email}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </label>
              <button onClick={handleBooking} className="submit-button" disabled={processing}>
                {processing ? 'Processing...' : 'Confirm Booking'}
              </button>
              {error && <p className="error-message">{error}</p>}
            </div>
          </section>
        )}
        {bookingConfirmed && (
          <section className="confirmation-section">
            <h2>Booking Confirmed!</h2>
            <p>
              Service: {selectedService.name} <br />
              Customer: {customerInfo.name} <br />
              Address: {customerInfo.address} <br />
              Phone: {customerInfo.phone} <br />
              Email: {customerInfo.email}
            </p>
            <p>
              Payment will be processed securely using Aptos and Manta Chain
              once the job is verified.
            </p>
          </section>
        )}
        <section className="payment-section">
          <h2>Payment Options</h2>
          <button className="payment-button coming-soon" disabled>
            Pay with Aptos - Coming Soon
          </button>
        </section>
      </main>
    </div>
  );
}

export default App;
