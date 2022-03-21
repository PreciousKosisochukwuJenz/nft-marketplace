const { expect } = require('chai')

const toWei = (number) => ethers.utils.parseEther(number.toString())
const fromWei = (number) => ethers.utils.formatEther(number)

describe('NFTMarketplace', () => {
  let deployer, address1, address2, address3, nft, marketplace
  let feePercent = 1
  let URI = 'Sample URI'

  beforeEach(async () => {
    // Get contract factories
    const NFT = await ethers.getContractFactory('NFT')

    const Marketplace = await ethers.getContractFactory('Marketplace')

    // Get signers
    ;[deployer, address1, address2, address3] = await ethers.getSigners()

    // Deploy contracts
    nft = await NFT.deploy()
    marketplace = await Marketplace.deploy(feePercent)
  })

  describe('Deployment', () => {
    it('Should track name and symbol of the collection', async () => {
      expect(await nft.name()).to.equal('Dapp NFT')
      expect(await nft.symbol()).to.equal('DAPP')
    })

    it('should track the marketplace address and feepercent', async () => {
      expect(await marketplace.feeAccount()).to.equal(deployer.address)
      expect(await marketplace.feePercent()).to.equal(feePercent)
    })
  })

  describe('NFT minting', () => {
    it('Should mint NFTs', async () => {
      // Mint first nft
      nft.connect(address1).mint(URI)
      expect(await nft.tokenCount()).to.equal(1)
      expect(await nft.balanceOf(address1.address)).to.equal(1)
      expect(await nft.tokenURI(1)).to.equal(URI)

      // Mint second nft
      nft.connect(address2).mint(URI)
      expect(await nft.tokenCount()).to.equal(1)
      expect(await nft.balanceOf(address2.address)).to.equal(1)
      expect(await nft.tokenURI(2)).to.equal(URI)
    })
  })

  describe('Making market items', () => {
    beforeEach(async () => {
      // Address one mint an nft
      await nft.connect(address1).mint(URI)

      // Address one approve for nft to be spent
      await nft.connect(address1).setApprovalForAll(marketplace.address, true)
    })
    it('Should track newly created items, transfer NFT from seller to marketplace and emit offered', async () => {
      expect(
        await marketplace.connect(address1).makeItem(nft.address, 1, toWei(1)),
      )
        .to.emit(marketplace, 'Offered')
        .withArgs(1, nft.address, 1, toWei(1), address1.address)

      // Owner of NFT should be marketplace
      expect(await nft.ownerOf(1)).to.equal(marketplace.address)
      expect(await marketplace.itemCount()).to.equal(1)

      const item = await marketplace.items(1)
      expect(item.itemId).to.equal(1)
      expect(item.nft).to.equal(nft.address), expect(item.tokenId).to.equal(1)
      expect(item.price).to.equal(toWei(1)), expect(item.sold).to.equal(false)
    })

    it('should be reverted if price is 0', async () => {
      await expect(
        marketplace.connect(address1).makeItem(nft.address, 1, 0),
      ).to.be.revertedWith('Price must be greater than zero')
    })
  })

  describe('Purchase marketplace item', () => {
    let price = 2
    let itemTotalPrice
    beforeEach(async () => {
      // Address one mint an nft
      await nft.connect(address1).mint(URI)

      // Address one approve for nft to be spent
      await nft.connect(address1).setApprovalForAll(marketplace.address, true)

      // Address 1 makes their nft a marketplace item
      await marketplace.connect(address1).makeItem(nft.address, 1, toWei(1))
    })

    it('Should update item as sold, pay seller, transfer NFT to buyer, charge fees and emit Bought', async () => {
      const address1InitialBalance = await address1.getBalance()
      const feeAccountInitialBalance = await deployer.getBalance()

      // Get item total price ( item price + market price)
      itemTotalPrice = await marketplace.getTotalPrice(1)

      // Address two purchase item
      await expect(
        marketplace
          .connect(address2)
          .purchaseItem(1, { value: itemTotalPrice }),
      )
        .to.emit(marketplace, 'Bought')
        .withArgs(
          1,
          nft.address,
          1,
          toWei(1),
          address1.address,
          address2.address,
        )

      const sellerFinalEthBalance = await address1.getBalance()
      const feeAccountFinalBalance = await deployer.getBalance()

      // Seller should recieve payment of the nft sold
      expect(+fromWei(sellerFinalEthBalance)).to.equal(
        +price + +fromWei(address1InitialBalance),
      )

      // Calculate fee
      const fee = (feePercent / 100) * price

      // fee account should recieve payment
      expect(+fromWei(feeAccountFinalBalance)).to.equal(
        +fee + +fromWei(feeAccountInitialBalance),
      )

      // Buyer should now own Nft
      expect(await nft.ownerOf(1)).to.equal(address2.address)

      // Check if item is marked as sold
      expect(await marketplace.item(1).sold).to.equal(true)
    })

    it('Should fail for invalid item id, sold item, and when not enough ether is paid', async () => {
      // Fail for invaild item id
      await expect(
        marketplace
          .connect(address1)
          .purchaseItem(2, { value: itemTotalPrice }),
      ).to.be.revertedWith("Item does't exist")

      await expect(
        marketplace
          .connect(address2)
          .purchaseItem(0, { value: itemTotalPrice }),
      ).to.be.revertedWith("Item does't exist")

      // fail when not enough ethers to pay for transaction
      await expect(
        marketplace.connect(address1).purchaseItem(1, { value: toWei(price) }),
      ).to.be.revertedWith('Not enough ethers to process this transaction')

      // Address two purchases item 1
      await marketplace
        .connect(address2)
        .purchaseItem(1, { value: itemTotalPrice })

      // Deployer tries purchasing item 1 after been sold
      await expect(
        await marketplace
          .connect(deployer)
          .purchaseItem(1, { value: itemTotalPrice }),
      ).to.be.revertedWith('Item has already been sold')
    })
  })
})
