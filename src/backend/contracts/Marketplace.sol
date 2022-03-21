// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';

contract Marketplace is ReentrancyGuard{
    address payable public immutable feeAccount;
    uint public immutable feePercent;
    uint public itemCount;

    struct Item{
        uint itemId;
        IERC721 nft;
        uint tokenId;
        uint price;
        address payable seller;
        bool sold;
    }

    event Offered(
        uint itemId,
        address indexed nft,
        uint tokenId,
        uint price,
        address indexed seller
    );


    event Bought(
        uint itemId,
        address indexed nft,
        uint tokenId,
        uint price,
        address indexed seller,
        address indexed buyer
    );

    mapping(uint => Item) public items;

    constructor(uint _feePercent){
        feeAccount = payable(msg.sender);
        feePercent = _feePercent;
    }

    function makeItem(IERC721 _nft, uint _tokenId, uint _price) external nonReentrant{
        require(_price > 0 , "Price must be greater than zero");
        itemCount++;

        _nft.transferFrom(msg.sender, address(this), _tokenId);
        items[itemCount] = Item(
            itemCount,
            _nft,
            _tokenId,
            _price,
            payable(msg.sender),
            false
        );

        // Emit event
        emit Offered(itemCount, address(_nft), _tokenId, _price, msg.sender);
    }


    // Purchase nft
    function purchaseItem(uint _itemId) external payable nonReentrant{
        uint _totalPrice = getTotalPrice(_itemId);

        // Get item from items mapping
        Item storage item = items[_itemId];
        require(_itemId > 0 && _itemId <= itemCount, "Item does't exist");
        require(msg.value >= _totalPrice, "Not enough ethers to process this transaction");
        require(!item.sold, "Item has already been sold");


        // Pay fee account and seller
        item.seller.transfer(item.price);
        feeAccount.transfer(_totalPrice - item.price);

        // Update item as sold
        item.sold = true;

        // transfer nft to buyer
        item.nft.transferFrom(address(this), msg.sender, item.tokenId);

        // Emit event
        emit Bought(item.itemId, address(item.nft), item.tokenId, item.price, item.seller, msg.sender);
    } 

    function getTotalPrice(uint _itemId) view public returns(uint){
        return (items[_itemId].price * (100 * feePercent) / 100);
    }
}