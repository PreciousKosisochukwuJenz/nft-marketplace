import { ethers } from 'ethers'
import { Row, Col, Card } from 'react-bootstrap'
import { useState, useEffect } from 'react'

function renderSoldItems(items) {
  return (
    <>
      <h2>Sold</h2>
      <Row xs={1} md={2} lg={4} className="g-4 py-3">
        {items.map((item, idx) => {
          ;<Col key={idx} className="overflow-hidden">
            <Card>
              <Card.Img variant="top" src={item.image} />
              <Card.Footer>
                For {ethers.utils.formatEther(item.totalPrice)} Eth - Recieved{' '}
                {ethers.utils.formatEther(item.price)} Eth
              </Card.Footer>
            </Card>
          </Col>
        })}
      </Row>
    </>
  )
}

export default function MyListedItems({ marketplace, nft, account }) {
  const [loading, setLoading] = useState(true)
  const [listedItems, setListedItems] = useState([])
  const [soldItems, setSoldItem] = useState([])
  const loadListedItems = async () => {
    const itemCount = await marketplace.itemCount()
    let listedItems = []
    let soldItems = []

    for (let i = 1; i <= itemCount; i++) {
      const item = await marketplace.items(i)
      if (item.seller == account) {
        const uri = await nft.tokenURI(item.tokenId)
        const response = await fetch(uri)
        const metadata = await response.json()
        const totalPrice = await marketplace.getTotalPrice(item.itemId)
        const itemm = {
          totalPrice,
          itemId: item.itemId,
          seller: item.seller,
          name: metadata.name,
          description: metadata.description,
          image: metadata.image,
          price: item.price,
        }

        listedItems.push(itemm)

        if (item.sold) soldItems.push(itemm)
      }
    }
    setLoading(false)
    setSoldItem(soldItems)
    setListedItems(listedItems)
  }

  useEffect(() => {
    loadListedItems()
  }, [])

  if (loading)
    return (
      <main style={{ padding: '1rem 0' }}>
        <h2>Loading...</h2>
      </main>
    )

  return (
    <div className="flex justify-center">
      {listedItems.length > 0 ? (
        <div className="px-5 py-3 container">
          <h2>Listed Items </h2>
          <Row xs={1} md={2} lg={4} className="g-4 py-3">
            {listedItems.map((item, idx) => (
              <Col key={idx} className="overflow-hidden">
                <Card>
                  <Card.Img variant="top" src={item.image} />
                  <Card.Footer>
                    <div className="d-grid">
                      For {ethers.utils.formatEther(item.totalPrice)} ETH
                    </div>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
          {soldItems.length > 0 && renderSoldItems(soldItems)}
        </div>
      ) : (
        <main style={{ padding: '1rem 0' }}>
          <h2>No Listed Items</h2>
        </main>
      )}
    </div>
  )
}
