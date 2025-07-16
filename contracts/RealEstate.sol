// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;


import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";



contract RealEstate is ERC721, Ownable {
    struct Property {
        uint256 price;
        address payable seller;
        string location;
        bytes32 description;
        bool isListed;
        bool isSold;
        address payable buyer;
        uint256 offerAmount;
        bool isInspectionPassed;
        bool FinancingApproved;
    }

    mapping(uint256 => Property) private properties;
    mapping(uint256 => uint256) public escrowBalances;
    mapping(address => uint256[]) private ownerProperties;
    mapping(uint256 => address) private propertyApprovals;


    uint256 private _propertyIdCounter;



    event PropertyListed(uint256 indexed propertyId, address indexed seller, uint256 price, string details);
    event OfferSubmitted(uint256 indexed propertyId, address indexed buyer, uint256 offerAmount);
    event OfferAccepted(uint256 indexed propertyId, address indexed buyer, uint256 offerAmount);
    event OfferRejected(uint256 indexed propertyId, address indexed buyer);
    event InspectionUpdated(uint256 indexed propertyId, bool isPassed);
    event FinancingApproved(uint256 indexed propertyId);
    event FinancingRejected(uint256 indexed propertyId);
    event PropertySold(uint256 indexed propertyId, address indexed buyer, uint256 salePrice);
    event PropertyDelisted(uint256 indexed propertyId, address indexed seller);
    event OwnershipTransferred(uint256 indexed propertyId, address indexed newOwner);
    event TransactionCompleted(uint256 indexed propertyId, address indexed buyer, uint256 salePrice);






    modifier onlyPropertyOwner(uint256 propertyId) {
        require(ownerOf(propertyId) == msg.sender, "Not the property owner");
        _;
    }
    modifier onlySeller(uint256 propertyId) {
        require(properties[propertyId].seller == msg.sender, "Not the seller");
        _;
    }
    constructor() ERC721("RealEstateNFT", "RENFT") Ownable(msg.sender) {
        _propertyIdCounter = 0;
    }


    // List property as an NFT
    function listProperty(uint256 price, string memory details) external {
        uint256 propertyId = _propertyIdCounter++;
        _mint(msg.sender, propertyId);

        properties[propertyId] = Property({
            price: price,
            seller: payable(msg.sender),
            location: details,
            description: keccak256(abi.encodePacked(details)),
            isListed: true,
            isSold: false,
            buyer: payable(address(0)),
            offerAmount: 0,
            isInspectionPassed: false,
            FinancingApproved: false
        });

        emit PropertyListed(propertyId, msg.sender, price, details);
    }



    // Submit an offer with a deposit
    function submitOffer(uint256 propertyId) external payable {
        require(properties[propertyId].isListed, "Property not listed");
        require(msg.value > 0, "Deposit required");
        require(properties[propertyId].offerAmount == 0, "Offer already exists");
        require(properties[propertyId].seller != msg.sender, "Seller cannot submit an offer");

        properties[propertyId].offerAmount = msg.value;
        properties[propertyId].buyer = payable(msg.sender);
        escrowBalances[propertyId] += msg.value;
        ownerProperties[msg.sender].push(propertyId);

        emit OfferSubmitted(propertyId, msg.sender, msg.value);
    }


    // Seller accepts an offer
    function acceptOffer(uint256 propertyId) onlySeller(propertyId) external {
        require(properties[propertyId].isListed, "property not listed");
        require(properties[propertyId].offerAmount > 0, "No offer to accept");

        properties[propertyId].isSold = true;
        properties[propertyId].isListed = false;

        // Transfer the property to the buyer
        _transfer(msg.sender, properties[propertyId].buyer, propertyId);

        // Transfer the funds from escrow to the seller
        uint256 salePrice = properties[propertyId].offerAmount;
        escrowBalances[propertyId] -= salePrice;
        properties[propertyId].seller.transfer(salePrice);

        emit OfferAccepted(propertyId, properties[propertyId].buyer, salePrice);
    }

}