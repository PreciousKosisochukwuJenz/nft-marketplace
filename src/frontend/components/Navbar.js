import { Navbar, Nav, Button, Container } from 'react-bootstrap'
import Logo from './logo.png'
import { Link } from 'react-router-dom'

const Navigation = ({ webHandler, account }) => {
  return (
    <Navbar expand="lg" bg="secondary" variant="dark">
      <Container>
        <Navbar.Brand>
          <img src={Logo} width="40" height="40" className="" alt="" />
          &nbsp; Dapp Nft Marketplace
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">
              Home
            </Nav.Link>
            <Nav.Link as={Link} to="/create">
              Create
            </Nav.Link>
            <Nav.Link as={Link} to="/my-listed-items">
              My NFT Item
            </Nav.Link>
            <Nav.Link as={Link} to="/my-purchases">
              My Purchases
            </Nav.Link>
          </Nav>
          <Nav>
            {account ? (
              <Nav.Link
                href={`https://etherscan.io/address/${account}`}
                target="_blank"
                rel="noopener noreferrer"
                className="button nav-button btn-sm mx-4"
              >
                <Button>
                  {/* {account.splice(0, 5) + '...' + account.splice(38, 42)} */}
                  {account}
                </Button>
              </Nav.Link>
            ) : (
              <Button onClick={webHandler} variant="outline-light">
                Connect wallet
              </Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}

export default Navigation
