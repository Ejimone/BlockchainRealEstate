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

    modifier onlyBuyer(uint256 propertyId) {
        require(properties[propertyId].buyer == msg.sender, "Not the buyer");
        _;
    }

    modifier onlyInspector(uint256 propertyId) {
        require(properties[propertyId].isInspectionPassed, "Inspection not passed");
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



    // Update inspection status (simulating oracle input)
    function updateInspectionStatus(uint256 propertyId, bool isPassed) external onlyInspector(propertyId) {
        properties[propertyId].isInspectionPassed = isPassed;
        emit InspectionUpdated(propertyId, isPassed);
    }


    // Update financing status (simulating oracle input)
    function updateFinancing(uint256 propertyId, bool approved) external onlyOwner {
        properties[propertyId].FinancingApproved = approved;
        if (approved) {
            emit FinancingApproved(propertyId);
        } else {
            emit FinancingRejected(propertyId);
        }
    }


    // complete transactions if conditions are met
    function CompleteTransaction(uint256 propertyId) external {
       Property memory property = properties[propertyId];
       require(property.isListed, "Property not listed");
       require(property.buyer == msg.sender || msg.sender == property.seller, "Not authorized to complete transaction");
       require(property.isInspectionPassed, "Inspection not passed");
       require(property.FinancingApproved, "Financing not approved");



        properties[propertyId].isListed = false;
        properties[propertyId].isSold = true;
        _transfer(property.seller, property.buyer, propertyId);


        payable(property.seller).transfer(escrowBalances[propertyId]);
        escrowBalances[propertyId] = 0;
        emit TransactionCompleted(propertyId, property.buyer, property.price);

    }


    // Refund deposit if transaction fails
    function refundDeposit(uint256 propertyId) external onlyBuyer(propertyId) {
        require(msg.sender == properties[propertyId].buyer, "Not the buyer");
        require(properties[propertyId].isListed, "property not listed");
        require(escrowBalances[propertyId] > 0, "No deposit to refund");


        payable(msg.sender).transfer(escrowBalances[propertyId]);
        properties[propertyId].buyer = payable(address(0));
        properties[propertyId].offerAmount = 0;
        escrowBalances[propertyId] = 0;
    }




}