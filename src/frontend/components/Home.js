import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Row, Col, Card, Button } from 'react-bootstrap'

const Home = ({ marketplace, nft }) => {
  const [items, setItem] = useState([])
  const [loading, setLoading] = useState(true)
  const loadMarketplaceItems = async () => {
    const itemCount = await marketplace.itemCount()
    const items = []
    for (let i = 1; i <= itemCount; i++) {
      const item = await marketplace.items(i)
      if (!item.sold) {
        const uri = await nft.tokenURI(item.tokenId)
        const response = await fetch(uri)
        const metadata = await response.json()
        const totalPrice = await marketplace.getTotalPrice(item.itemId)
        items.push({
          totalPrice,
          itemId: item.itemId,
          seller: item.seller,
          name: metadata.name,
          description: metadata.description,
          image: metadata.image,
          price: item.price,
        })
      }
    }
    setItem(items)
    setLoading(false)
  }

  const buyMarketItem = async (item) => {
    await (
      await marketplace.purchaseItem(item.itemId, {
        value: item.totalPrice,
      })
    ).wait()
    loadMarketplaceItems()
  }

  useEffect(() => {
    loadMarketplaceItems()
  }, [])

  if (loading)
    return (
      <main style={{ padding: '1rem 0' }}>
        <h2>Loading...</h2>
      </main>
    )

  return (
    <div className="flex justify-center">
      {items.length > 0 ? (
        <div className="px-5 py-3 container">
          <Row xs={1} md={2} lg={4} className="g-4 py-3">
            {items.map((item, idx) => (
              <Col key={idx} className="overflow-hidden">
                <Card>
                  <Card.Img variant="top" src={item.image} />
                  <Card.Body>
                    <Card.Title>{item.name}</Card.Title>
                    <Card.Text>{item.description}</Card.Text>
                  </Card.Body>
                  <Card.Footer>
                    <div className="d-grid">
                      <Button
                        onClick={() => buyMarketItem(item)}
                        variant="primary"
                        size="lg"
                      >
                        Buy NFT for {ethers.utils.formatEther(item.totalPrice)}{' '}
                        ETH
                      </Button>
                    </div>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      ) : (
        <main style={{ padding: '1rem 0' }}>
          <h2>No Listed Items</h2>
        </main>
      )}
    </div>
  )
}

export default Home
