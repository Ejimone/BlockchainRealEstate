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

}