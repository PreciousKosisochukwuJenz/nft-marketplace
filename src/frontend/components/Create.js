import { ethers } from 'ethers'
import { Row, Form, Button } from 'react-bootstrap'
import { create as ipfsHttpClient } from 'ipfs-http-client'
import { useState } from 'react'

const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')

const Create = ({ marketplace, nft }) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState('')
  const [price, setPrice] = useState(null)

  const uploadToIpfs = async (event) => {
    event.preventDefault()
    const file = event.target.files[0]
    if (typeof file !== 'undefined') {
      try {
        const result = await client.add(file)
        console.log(result)
        setImage(`https://ipfs.infura.io/ipfs/${result.path}`)
      } catch (err) {
        console.log('Uplod to ipfs error: ', err)
      }
    }
  }

  const createNft = async () => {
    if (!name || !image || !description) return

    try {
      const result = await client.add(
        JSON.stringify({
          name,
          description,
          image,
        }),
      )

      mintAndListNFT(result)
    } catch (err) {
      console.log('ERR: ', err)
    }
  }

  const mintAndListNFT = async (result) => {
    const uri = `https://ipfs.infura.io/ipfs/${result.path}`

    // mint nft
    await (await nft.mint(uri)).wait()

    // get token Id
    const id = await nft.tokenCount()

    // approve marketplace to spend nft
    await await nft.setApprovalForAll(marketplace.address, true)

    // add nft to marketplace
    const listingPrice = ethers.utils.parseEther(price.toString())
    await (await marketplace.makeItem(nft.address, id, listingPrice)).wait()
  }
  return (
    <div className="container-fluid mt-5">
      <div className="row">
        <main
          role="main"
          className="col-lg-12 mx-auto"
          style={{ maxWidth: '1000px' }}
        >
          <div className="content mx-auto">
            <Row className="g-4">
              <Form.Control type="file" name="file" onChange={uploadToIpfs} />
              <Form.Control
                type="text"
                size="lg"
                placeholder="name"
                onChange={(e) => setName(e.target.value)}
              />
              <Form.Control
                as="textarea"
                size="lg"
                placeholder="description"
                onChange={(e) => setDescription(e.target.value)}
              />
              <Form.Control
                type="number"
                size="lg"
                placeholder="price in ETH"
                onChange={(e) => setPrice(e.target.value)}
              />
              <div className="d-grid px-0">
                <Button onClick={createNft} variant="primary" size="lg">
                  Create NFT and list
                </Button>
              </div>
            </Row>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Create
