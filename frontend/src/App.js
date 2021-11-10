import { useEffect, useState } from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';

import idl from './idl.json';
import kp from './keypair.json'


// SystemProgram is a reference to the Solana runtime!
const { SystemProgram } = web3;

// Create a keypair for the account that will hold the GIF data.
const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secret)

// Get out program's ID from the IDL file.
const programID = new PublicKey(idl.metadata.address);

// Set our network to devnet.
const network = clusterApiUrl('devnet');

// Control how we want to acknowledge when a transaction is "done".
const opts = {
  preflightCommitment: "processed"
}

// Constants
const TWITTER_HANDLE = 'itsjamesmurray';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {
  // State
  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [gifList, setGifList] = useState([]);

  // Actions
  // This function holds the logic for deciding if a Phantom Wallet is connected or not
  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;

      if (solana) {
        if (solana.isPhantom) {
          console.log('Phantom wallet found!');
          const response = await solana.connect({ onlyIfTrusted: true });
          console.log(
            'Connected with Public Key:',
            response.publicKey.toString()
          );
          setWalletAddress(response.publicKey.toString());
        }
      } else {
        alert('Solana object not found! Get a Phantom Wallet 👻');
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Connect to a Solana Phantom Wallet
  const connectWallet = async () => {
    const { solana } = window;

    if (solana) {
      const response = await solana.connect();
      console.log('Connected with Public Key:', response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  };

  // Send the GIF that a user inputs
  const sendGif = async () => {
    if (inputValue.length === 0) {
      console.log("No gif link given!")
      return
    }
    if (inputValue.slice(-4) !== ".gif") {
      console.log("Not a gif link! Please fix!")
      return
    }
    console.log("GIF link: ", inputValue);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: walletAddress
        }
      });
      console.log("GIF successfully sent to program: ", inputValue)

      await getGifList();
    } catch (e) {
      console.log("Error sending GIF: ", e)
    }
  };

  const filterGifs = async () => {
    await getGifList()
    if (filterValue === '') {
      return
    } else {
      let filteredGifs = []
      console.log("Filtering for address: ", filterValue);
      for (let i = 0; i < gifList.length; i++) {
        if (gifList[i].userAddress.toString() === filterValue) {
          filteredGifs.push(gifList[i])
        }
      }
    setGifList(filteredGifs)
    return
    }
  }

  // Vote GMI on a GIF
  async function clickGmiVote(gif_index) {
    const provider = getProvider();
    const program = new Program(idl, programID, provider);
    await program.rpc.gmiVote(gif_index, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: walletAddress
        }
    });
    getGifList()
  };

  // Vote NGMI on a GIF
  async function clickNgmiVote(gif_index) {
    const provider = getProvider();
    const program = new Program(idl, programID, provider);
    await program.rpc.ngmiVote(gif_index, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: walletAddress
        }
    });
    getGifList()
  };

  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  };

  const onFilterChange = (event) => {
    const { value } = event.target;
    setFilterValue(value);
  }

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection, window.solana, opts.preflightCommitment
    );
    return provider
  };

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log('ping')
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      console.log("Created a new BaseAccount with address: ", baseAccount.publicKey.toString());
      await getGifList();

    } catch(e) {
      console.log("Error creating BaseAccount account: ", e)
    }
  };
    
  // We want to render this UI when the user hasn't connected their wallet to our app yet.
  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  );

  // We want the GIFs rendered when a user is connected with their wallet
  const renderConnectedContainer = () => {
    // If we hit this, it means the program account hasn't been initialized.
    if (gifList === null) {
      return (
        <div className="connected-container">
        <button className="cta-button submit-gif-button" onClick={createGifAccount}>
          Do One-Time Initialization for GIF Program Account
        </button>
        </div>
      )
    }
    // Otherwise we are good. Account exists. user can submit GIFs
    else {
      return (
        <div className="connected-container">
          <input
            type="text"
            placeholder="Enter gif link!" 
            className="input"
            value={inputValue}
            onChange={onInputChange}
          />
          <button className="cta-button submit-gif-button" onClick={sendGif}>
            Submit
          </button>
          <input
            type="text"
            placeholder="Filter by address..." 
            className="input"
            value={filterValue}
            onChange={onFilterChange}
          />
          <button className="cta-button submit-gif-button" onClick={filterGifs}>
            Filter
          </button>
          <div className="gif-grid">
            {gifList.map((item, index) => (
              <div className="gif-item" key={index}>
                <img src={item.gifLink}/>
                <p className="address-text">Submitted by: {item.userAddress.toString()}</p>
                <div className="vote-buttons">
                  <button className="cta-button submit-gmi-button" onClick={() => clickGmiVote(index)}> ⬆️ ️GMI: {item.gmiVotes.toString()}</button>
                  <button className="cta-button submit-ngmi-button" onClick={() => clickNgmiVote(index)}> ⬇️ NGMI: {item.ngmiVotes.toString()} </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }
  };
  
  // When our component first mounts, let's check to see if we have a connected Phantom Wallet
  useEffect(() => {
    window.addEventListener('load', async (event) => {
      await checkIfWalletIsConnected();
    });
  }, []);

  const getGifList = async () => {
    try {
      const provider = getProvider();
      const program  = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);

      console.log("Got the account", account);
      console.log("GIF COUNT: ", account.totalGifs.toString());
      setGifList(account.gifList);
    } catch (e) {
      console.log("Error in getGifs: ", e);
      setGifList(null);
    }
  }

  useEffect(() => {
    if (walletAddress) {
      console.log('Fetching GIF list...');
      getGifList()
    }
  }, [walletAddress]);

  return (
    <div className="App">
      <div className={walletAddress ? 'authed-container' : 'container'}>
        <div className="header-container">
          <p className="header">🌈 WAGMI WALL 👻</p>
          <p className="sub-text">
            if we stay positive, we're all gonna make it
          </p>
          {/* If not connected, show a button to connect via Phantom */}
          {!walletAddress && renderNotConnectedContainer()}
          {/* If connected, show the GIFs */}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built with ❤️ by @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;