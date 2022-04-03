import './App.css'
import Navigation from './Navbar'
import { ethers } from 'ethers'
import { useState } from 'react'
import MarketplaceAddress from '../contractsData/Marketplace-address.json'
import MarketplaceAbi from '../contractsData/Marketplace.json'
import NftAddress from '../contractsData/NFT-address.json'
import NftAbi from '../contractsData/NFT.json'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Spinner } from 'react-bootstrap'
import Home from './Home'
import Create from './Create'
import MyListedItems from './MyListedItems'

function App() {
  const [loading, setLoading] = useState(true)
  const [account, setAccount] = useState(null)
  const [marketplace, setMarketplace] = useState({})
  const [nft, setNFT] = useState({})

  const webHandler = async () => {
    // Request all accounts from metamask { metamask login/ connect}
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    })

    // Set account account to the first account connected to metamasks
    setAccount(accounts[0])

    // Get provider from metamask
    const provider = new ethers.providers.Web3Provider(window.ethereum)

    // get signer
    const signer = await provider.getSigner()

    // Load contracts from blockchain
    await loadContracts(signer)
  }

  const loadContracts = async (signer) => {
    const marketplace = new ethers.Contract(
      MarketplaceAddress.address,
      MarketplaceAbi.abi,
      signer,
    )
    setMarketplace(marketplace)

    const nft = new ethers.Contract(NftAddress.address, NftAbi.abi, signer)
    setNFT(nft)
    // toogle loading
    setLoading(false)
  }

  return (
    <BrowserRouter>
      <div className="App">
        <Navigation webHandler={webHandler} account={account} />
        {loading ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '80vh',
            }}
          >
            <Spinner animation="border" style={{ display: 'flex' }} />
            <p className="mx-3 my-0">Awaiting metamask connection...</p>
          </div>
        ) : (
          <Routes>
            <Route
              path="/"
              element={<Home marketplace={marketplace} nft={nft} />}
            ></Route>
            <Route
              path="/create"
              element={<Create marketplace={marketplace} nft={nft} />}
            ></Route>
            <Route
              path="/my-listed-items"
              element={
                <MyListedItems
                  marketplace={marketplace}
                  nft={nft}
                  account={account}
                />
              }
            ></Route>
            <Route path="/my-purchases"></Route>
          </Routes>
        )}
      </div>
    </BrowserRouter>
  )
}

export default App
