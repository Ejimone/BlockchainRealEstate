// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract RealEstate is ERC721, Ownable, ReentrancyGuard, Pausable {
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
        uint256 listedAt;
        uint256 auctionEndTime;
        uint256 minimumBid;
        address agent;
        uint256 agentCommission; // in basis points (100 = 1%)
        PropertyType propertyType;
        uint256 area; // in square meters
        uint256 bedrooms;
        uint256 bathrooms;
        string[] documents; // IPFS hashes for documents
    }

    enum PropertyType {
        RESIDENTIAL,
        COMMERCIAL,
        LAND,
        APARTMENT,
        OFFICE
    }

    struct Offer {
        address buyer;
        uint256 amount;
        uint256 timestamp;
        bool isActive;
        uint256 expiresAt;
    }

    struct Transaction {
        uint256 propertyId;
        address seller;
        address buyer;
        uint256 price;
        uint256 timestamp;
        string transactionHash;
    }

    mapping(uint256 => Property) private properties;
    mapping(uint256 => uint256) public escrowBalances;
    mapping(address => uint256[]) private ownerProperties;
    mapping(uint256 => address) private propertyApprovals;
    mapping(uint256 => Offer[]) private propertyOffers;
    mapping(uint256 => Transaction) private propertyTransactions;
    mapping(address => bool) public authorizedAgents;
    mapping(uint256 => address[]) private propertyViewers; // Track who viewed a property
    
    address public appraiser;
    uint256 public platformFee = 250; // 2.5% in basis points
    uint256 public constant MAX_COMMISSION = 1000; // 10% max commission
    uint256 private _propertyIdCounter;
    uint256 private _transactionCounter;

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
    event AuctionStarted(uint256 indexed propertyId, uint256 startTime, uint256 endTime);
    event AuctionEnded(uint256 indexed propertyId, address indexed winner, uint256 winningBid);
    event AgentAuthorized(address indexed agent, bool authorized);
    event PropertyViewed(uint256 indexed propertyId, address indexed viewer);
    event DocumentAdded(uint256 indexed propertyId, string documentHash);
    event PriceUpdated(uint256 indexed propertyId, uint256 oldPrice, uint256 newPrice);
    event OfferExpired(uint256 indexed propertyId, address indexed buyer, uint256 amount);

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

    modifier onlyAppraiser() {
        require(msg.sender == appraiser, "Not the appraiser");
        _;
    }

    modifier propertyExists(uint256 propertyId) {
        require(propertyId < _propertyIdCounter, "Property does not exist");
        _;
    }

    modifier onlyAuthorizedAgent() {
        require(authorizedAgents[msg.sender], "Not an authorized agent");
        _;
    }

    modifier auctionActive(uint256 propertyId) {
        require(
            properties[propertyId].auctionEndTime > 0 && 
            block.timestamp < properties[propertyId].auctionEndTime,
            "Auction not active"
        );
        _;
    }

    modifier auctionEnded(uint256 propertyId) {
        require(
            properties[propertyId].auctionEndTime > 0 && 
            block.timestamp >= properties[propertyId].auctionEndTime,
            "Auction still active"
        );
        _;
    }

    constructor() ERC721("RealEstateNFT", "RENFT") Ownable(msg.sender) {
        _propertyIdCounter = 0;
        _transactionCounter = 0;
        appraiser = msg.sender;
        authorizedAgents[msg.sender] = true;
    }

    // Core Functions

    // List property as an NFT
    function listProperty(
        uint256 price,
        string memory details,
        PropertyType propertyType,
        uint256 area,
        uint256 bedrooms,
        uint256 bathrooms,
        address agent,
        uint256 agentCommission
    ) external whenNotPaused {
        require(price > 0, "Price must be greater than 0");
        require(bytes(details).length > 0, "Details cannot be empty");
        require(agentCommission <= MAX_COMMISSION, "Commission too high");
        require(agent != address(0), "Invalid agent address");
        
        uint256 propertyId = _propertyIdCounter++;
        _mint(msg.sender, propertyId);

        string[] memory emptyDocs;
        
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
            FinancingApproved: false,
            listedAt: block.timestamp,
            auctionEndTime: 0,
            minimumBid: 0,
            agent: agent,
            agentCommission: agentCommission,
            propertyType: propertyType,
            area: area,
            bedrooms: bedrooms,
            bathrooms: bathrooms,
            documents: emptyDocs
        });

        emit PropertyListed(propertyId, msg.sender, price, details);
    }

    // Simple listing function for backwards compatibility
    function listPropertySimple(uint256 price, string memory details) external {
        string[] memory emptyDocs;
        
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
            FinancingApproved: false,
            listedAt: block.timestamp,
            auctionEndTime: 0,
            minimumBid: 0,
            agent: msg.sender,
            agentCommission: 0,
            propertyType: PropertyType.RESIDENTIAL,
            area: 0,
            bedrooms: 0,
            bathrooms: 0,
            documents: emptyDocs
        });

        emit PropertyListed(propertyId, msg.sender, price, details);
    }

    // Submit an offer with a deposit
    function submitOffer(uint256 propertyId, uint256 expiresIn) external payable propertyExists(propertyId) whenNotPaused nonReentrant {
        require(properties[propertyId].isListed, "Property not listed");
        require(msg.value > 0, "Deposit required");
        require(properties[propertyId].seller != msg.sender, "Seller cannot submit an offer");
        require(expiresIn > 0, "Expiration time must be greater than 0");

        // Check if there's already an active offer from this buyer
        bool hasActiveOffer = false;
        for (uint256 i = 0; i < propertyOffers[propertyId].length; i++) {
            if (propertyOffers[propertyId][i].buyer == msg.sender && propertyOffers[propertyId][i].isActive) {
                hasActiveOffer = true;
                break;
            }
        }
        require(!hasActiveOffer, "You already have an active offer");

        // Add the offer to the offers array
        propertyOffers[propertyId].push(Offer({
            buyer: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp,
            isActive: true,
            expiresAt: block.timestamp + expiresIn
        }));

        escrowBalances[propertyId] += msg.value;
        ownerProperties[msg.sender].push(propertyId);

        emit OfferSubmitted(propertyId, msg.sender, msg.value);
    }

    // Simple offer submission for backwards compatibility
    function submitOfferSimple(uint256 propertyId) external payable whenNotPaused {
        require(propertyId < _propertyIdCounter, "Property does not exist");
        require(properties[propertyId].isListed, "Property not listed");
        require(msg.value > 0, "Deposit required");
        require(properties[propertyId].seller != msg.sender, "Seller cannot submit an offer");

        // Check if there's already an active offer from this buyer
        bool hasActiveOffer = false;
        for (uint256 i = 0; i < propertyOffers[propertyId].length; i++) {
            if (propertyOffers[propertyId][i].buyer == msg.sender && propertyOffers[propertyId][i].isActive) {
                hasActiveOffer = true;
                break;
            }
        }
        require(!hasActiveOffer, "You already have an active offer");

        // Add the offer to the offers array
        propertyOffers[propertyId].push(Offer({
            buyer: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp,
            isActive: true,
            expiresAt: block.timestamp + 7 days
        }));

        escrowBalances[propertyId] += msg.value;
        ownerProperties[msg.sender].push(propertyId);

        emit OfferSubmitted(propertyId, msg.sender, msg.value);
    }

    // Seller accepts a specific offer
    function acceptOffer(uint256 propertyId, address buyerAddress) external onlySeller(propertyId) propertyExists(propertyId) whenNotPaused nonReentrant {
        require(properties[propertyId].isListed, "Property not listed");
        
        // Find the offer
        uint256 offerIndex = type(uint256).max;
        for (uint256 i = 0; i < propertyOffers[propertyId].length; i++) {
            if (propertyOffers[propertyId][i].buyer == buyerAddress && propertyOffers[propertyId][i].isActive) {
                require(block.timestamp < propertyOffers[propertyId][i].expiresAt, "Offer expired");
                offerIndex = i;
                break;
            }
        }
        require(offerIndex != type(uint256).max, "No active offer found");
        
        Offer storage acceptedOffer = propertyOffers[propertyId][offerIndex];
        uint256 salePrice = acceptedOffer.amount;
        
        // Calculate fees
        uint256 platformFeeAmount = (salePrice * platformFee) / 10000;
        uint256 agentFeeAmount = (salePrice * properties[propertyId].agentCommission) / 10000;
        uint256 sellerAmount = salePrice - platformFeeAmount - agentFeeAmount;
        
        // Update property state
        properties[propertyId].isSold = true;
        properties[propertyId].isListed = false;
        properties[propertyId].buyer = payable(buyerAddress);
        properties[propertyId].offerAmount = salePrice;
        
        // Mark offer as accepted and deactivate others
        acceptedOffer.isActive = false;
        for (uint256 i = 0; i < propertyOffers[propertyId].length; i++) {
            if (i != offerIndex && propertyOffers[propertyId][i].isActive) {
                propertyOffers[propertyId][i].isActive = false;
                // Refund other offers
                payable(propertyOffers[propertyId][i].buyer).transfer(propertyOffers[propertyId][i].amount);
                escrowBalances[propertyId] -= propertyOffers[propertyId][i].amount;
            }
        }
        
        // Transfer the property to the buyer
        _transfer(msg.sender, buyerAddress, propertyId);
        
        // Transfer funds
        escrowBalances[propertyId] -= salePrice;
        payable(msg.sender).transfer(sellerAmount);
        
        // Transfer fees
        if (platformFeeAmount > 0) {
            payable(owner()).transfer(platformFeeAmount);
        }
        if (agentFeeAmount > 0) {
            payable(properties[propertyId].agent).transfer(agentFeeAmount);
        }
        
        // Record transaction
        propertyTransactions[propertyId] = Transaction({
            propertyId: propertyId,
            seller: msg.sender,
            buyer: buyerAddress,
            price: salePrice,
            timestamp: block.timestamp,
            transactionHash: ""
        });
        
        emit OfferAccepted(propertyId, buyerAddress, salePrice);
    }

    // Simple accept first active offer for backwards compatibility
    function acceptFirstOffer(uint256 propertyId) external {
        require(propertyOffers[propertyId].length > 0, "No offers available");
        
        address firstActiveBuyer = address(0);
        for (uint256 i = 0; i < propertyOffers[propertyId].length; i++) {
            if (propertyOffers[propertyId][i].isActive) {
                firstActiveBuyer = propertyOffers[propertyId][i].buyer;
                break;
            }
        }
        require(firstActiveBuyer != address(0), "No active offers found");
        
        // Call the acceptOffer function directly to avoid recursion
        require(properties[propertyId].seller == msg.sender, "Not the seller");
        require(propertyId < _propertyIdCounter, "Property does not exist");
        require(properties[propertyId].isListed, "Property not listed");
        
        // Find the offer
        uint256 offerIndex = type(uint256).max;
        for (uint256 i = 0; i < propertyOffers[propertyId].length; i++) {
            if (propertyOffers[propertyId][i].buyer == firstActiveBuyer && propertyOffers[propertyId][i].isActive) {
                require(block.timestamp < propertyOffers[propertyId][i].expiresAt, "Offer expired");
                offerIndex = i;
                break;
            }
        }
        require(offerIndex != type(uint256).max, "No active offer found");
        
        Offer storage acceptedOffer = propertyOffers[propertyId][offerIndex];
        uint256 salePrice = acceptedOffer.amount;
        
        // Calculate fees
        uint256 platformFeeAmount = (salePrice * platformFee) / 10000;
        uint256 agentFeeAmount = (salePrice * properties[propertyId].agentCommission) / 10000;
        uint256 sellerAmount = salePrice - platformFeeAmount - agentFeeAmount;
        
        // Update property state
        properties[propertyId].isSold = true;
        properties[propertyId].isListed = false;
        properties[propertyId].buyer = payable(firstActiveBuyer);
        properties[propertyId].offerAmount = salePrice;
        
        // Mark offer as accepted and deactivate others
        acceptedOffer.isActive = false;
        for (uint256 i = 0; i < propertyOffers[propertyId].length; i++) {
            if (i != offerIndex && propertyOffers[propertyId][i].isActive) {
                propertyOffers[propertyId][i].isActive = false;
                // Refund other offers
                payable(propertyOffers[propertyId][i].buyer).transfer(propertyOffers[propertyId][i].amount);
                escrowBalances[propertyId] -= propertyOffers[propertyId][i].amount;
            }
        }
        
        // Transfer the property to the buyer
        _transfer(msg.sender, firstActiveBuyer, propertyId);
        
        // Transfer funds
        escrowBalances[propertyId] -= salePrice;
        payable(msg.sender).transfer(sellerAmount);
        
        // Transfer fees
        if (platformFeeAmount > 0) {
            payable(owner()).transfer(platformFeeAmount);
        }
        if (agentFeeAmount > 0) {
            payable(properties[propertyId].agent).transfer(agentFeeAmount);
        }
        
        // Record transaction
        propertyTransactions[propertyId] = Transaction({
            propertyId: propertyId,
            seller: msg.sender,
            buyer: firstActiveBuyer,
            price: salePrice,
            timestamp: block.timestamp,
            transactionHash: ""
        });
        
        emit OfferAccepted(propertyId, firstActiveBuyer, salePrice);
    }

    // Function to reject an offer
    function rejectOffer(uint256 propertyId, address buyerAddress) external onlySeller(propertyId) propertyExists(propertyId) whenNotPaused nonReentrant {
        require(properties[propertyId].isListed, "Property not listed");
        
        // Find the offer to reject
        uint256 offerIndex = type(uint256).max;
        for (uint256 i = 0; i < propertyOffers[propertyId].length; i++) {
            if (propertyOffers[propertyId][i].buyer == buyerAddress && propertyOffers[propertyId][i].isActive) {
                offerIndex = i;
                break;
            }
        }
        require(offerIndex != type(uint256).max, "No active offer found");
        
        Offer storage rejectedOffer = propertyOffers[propertyId][offerIndex];
        uint256 offerAmount = rejectedOffer.amount;
        
        // Deactivate the offer
        rejectedOffer.isActive = false;
        
        // Refund the deposit to the buyer
        escrowBalances[propertyId] -= offerAmount;
        payable(buyerAddress).transfer(offerAmount);
        
        emit OfferRejected(propertyId, buyerAddress);
    }

    // Backwards compatibility - reject first offer
    function rejectFirstOffer(uint256 propertyId) external {
        require(propertyOffers[propertyId].length > 0, "No offers available");
        
        address firstActiveBuyer = address(0);
        for (uint256 i = 0; i < propertyOffers[propertyId].length; i++) {
            if (propertyOffers[propertyId][i].isActive) {
                firstActiveBuyer = propertyOffers[propertyId][i].buyer;
                break;
            }
        }
        require(firstActiveBuyer != address(0), "No active offers found");
        
        // Call rejectOffer logic directly
        require(properties[propertyId].seller == msg.sender, "Not the seller");
        require(propertyId < _propertyIdCounter, "Property does not exist");
        require(properties[propertyId].isListed, "Property not listed");
        
        // Find the offer to reject
        uint256 offerIndex = type(uint256).max;
        for (uint256 i = 0; i < propertyOffers[propertyId].length; i++) {
            if (propertyOffers[propertyId][i].buyer == firstActiveBuyer && propertyOffers[propertyId][i].isActive) {
                offerIndex = i;
                break;
            }
        }
        require(offerIndex != type(uint256).max, "No active offer found");
        
        Offer storage rejectedOffer = propertyOffers[propertyId][offerIndex];
        uint256 offerAmount = rejectedOffer.amount;
        
        // Deactivate the offer
        rejectedOffer.isActive = false;
        
        // Refund the deposit to the buyer
        escrowBalances[propertyId] -= offerAmount;
        payable(firstActiveBuyer).transfer(offerAmount);
        
        emit OfferRejected(propertyId, firstActiveBuyer);
    }

    // Inspection and Financing Functions

    // Update inspection status
    function updateInspectionStatus(uint256 propertyId, bool isPassed) external onlyAppraiser propertyExists(propertyId) {
        require(properties[propertyId].isListed, "Property not listed");
        properties[propertyId].isInspectionPassed = isPassed;
        emit InspectionUpdated(propertyId, isPassed);
    }

    // Update financing status
    function updateFinancing(uint256 propertyId, bool approved) external onlyOwner propertyExists(propertyId) {
        properties[propertyId].FinancingApproved = approved;
        if (approved) {
            emit FinancingApproved(propertyId);
        } else {
            emit FinancingRejected(propertyId);
        }
    }

    // Function for inspecting a property
    function inspectProperty(uint256 propertyId) external onlyAppraiser propertyExists(propertyId) {
        require(properties[propertyId].isListed, "Property not listed");
        require(!properties[propertyId].isInspectionPassed, "Inspection already passed");

        // Simulate inspection logic here
        properties[propertyId].isInspectionPassed = true;
        emit InspectionUpdated(propertyId, true);
    }

    // Complete transactions if conditions are met
    function completeTransaction(uint256 propertyId) external propertyExists(propertyId) whenNotPaused nonReentrant {
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

    // Auction Functions

    // Start auction for a property
    function startAuction(uint256 propertyId, uint256 minimumBid, uint256 duration) external onlySeller(propertyId) propertyExists(propertyId) whenNotPaused {
        require(properties[propertyId].isListed, "Property not listed");
        require(properties[propertyId].auctionEndTime == 0, "Auction already started");
        require(minimumBid > 0, "Minimum bid must be greater than 0");
        require(duration > 0, "Duration must be greater than 0");

        properties[propertyId].auctionEndTime = block.timestamp + duration;
        properties[propertyId].minimumBid = minimumBid;

        emit AuctionStarted(propertyId, block.timestamp, block.timestamp + duration);
    }

    // Bid on auction
    function bidOnAuction(uint256 propertyId) external payable auctionActive(propertyId) propertyExists(propertyId) whenNotPaused nonReentrant {
        require(msg.value >= properties[propertyId].minimumBid, "Bid too low");
        require(properties[propertyId].seller != msg.sender, "Seller cannot bid");
        
        // Find current highest bid
        uint256 highestBid = 0;
        address highestBidder = address(0);
        
        for (uint256 i = 0; i < propertyOffers[propertyId].length; i++) {
            if (propertyOffers[propertyId][i].isActive && propertyOffers[propertyId][i].amount > highestBid) {
                highestBid = propertyOffers[propertyId][i].amount;
                highestBidder = propertyOffers[propertyId][i].buyer;
            }
        }
        
        require(msg.value > highestBid, "Bid must be higher than current highest bid");
        
        // Refund previous highest bidder
        if (highestBidder != address(0)) {
            payable(highestBidder).transfer(highestBid);
            escrowBalances[propertyId] -= highestBid;
        }
        
        // Add new bid
        propertyOffers[propertyId].push(Offer({
            buyer: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp,
            isActive: true,
            expiresAt: properties[propertyId].auctionEndTime
        }));
        
        escrowBalances[propertyId] += msg.value;
        emit OfferSubmitted(propertyId, msg.sender, msg.value);
    }

    // End auction and transfer to highest bidder
    function endAuction(uint256 propertyId) external auctionEnded(propertyId) propertyExists(propertyId) whenNotPaused nonReentrant {
        require(properties[propertyId].isListed, "Property not listed");
        
        // Find highest bid
        uint256 highestBid = 0;
        address highestBidder = address(0);
        
        for (uint256 i = 0; i < propertyOffers[propertyId].length; i++) {
            if (propertyOffers[propertyId][i].isActive && propertyOffers[propertyId][i].amount > highestBid) {
                highestBid = propertyOffers[propertyId][i].amount;
                highestBidder = propertyOffers[propertyId][i].buyer;
            }
        }
        
        if (highestBidder != address(0)) {
            // Transfer property to highest bidder
            properties[propertyId].isSold = true;
            properties[propertyId].isListed = false;
            properties[propertyId].buyer = payable(highestBidder);
            properties[propertyId].offerAmount = highestBid;
            
            // Transfer the property to the buyer
            _transfer(properties[propertyId].seller, highestBidder, propertyId);
            
            // Calculate and transfer fees
            uint256 platformFeeAmount = (highestBid * platformFee) / 10000;
            uint256 agentFeeAmount = (highestBid * properties[propertyId].agentCommission) / 10000;
            uint256 sellerAmount = highestBid - platformFeeAmount - agentFeeAmount;
            
            // Transfer funds
            escrowBalances[propertyId] -= highestBid;
            payable(properties[propertyId].seller).transfer(sellerAmount);
            
            if (platformFeeAmount > 0) {
                payable(owner()).transfer(platformFeeAmount);
            }
            if (agentFeeAmount > 0) {
                payable(properties[propertyId].agent).transfer(agentFeeAmount);
            }
            
            emit AuctionEnded(propertyId, highestBidder, highestBid);
        } else {
            // No bids, auction failed
            properties[propertyId].auctionEndTime = 0;
            properties[propertyId].minimumBid = 0;
            emit AuctionEnded(propertyId, address(0), 0);
        }
    }

    // Additional Functions

    // Update property price
    function updatePropertyPrice(uint256 propertyId, uint256 newPrice) external onlySeller(propertyId) propertyExists(propertyId) {
        require(properties[propertyId].isListed, "Property not listed");
        require(newPrice > 0, "Price must be greater than 0");
        require(properties[propertyId].auctionEndTime == 0, "Cannot update price during auction");
        
        uint256 oldPrice = properties[propertyId].price;
        properties[propertyId].price = newPrice;
        
        emit PriceUpdated(propertyId, oldPrice, newPrice);
    }

    // Add document to property
    function addDocument(uint256 propertyId, string memory documentHash) external onlySeller(propertyId) propertyExists(propertyId) {
        require(bytes(documentHash).length > 0, "Document hash cannot be empty");
        
        properties[propertyId].documents.push(documentHash);
        emit DocumentAdded(propertyId, documentHash);
    }

    // Record property viewing
    function viewProperty(uint256 propertyId) external propertyExists(propertyId) {
        require(properties[propertyId].isListed, "Property not listed");
        
        propertyViewers[propertyId].push(msg.sender);
        emit PropertyViewed(propertyId, msg.sender);
    }

    // Refund deposit if transaction fails
    function refundDeposit(uint256 propertyId) external propertyExists(propertyId) whenNotPaused nonReentrant {
        require(properties[propertyId].isListed, "Property not listed");
        
        // Find caller's active offer
        uint256 offerIndex = type(uint256).max;
        for (uint256 i = 0; i < propertyOffers[propertyId].length; i++) {
            if (propertyOffers[propertyId][i].buyer == msg.sender && propertyOffers[propertyId][i].isActive) {
                offerIndex = i;
                break;
            }
        }
        require(offerIndex != type(uint256).max, "No active offer found");
        
        Offer storage offer = propertyOffers[propertyId][offerIndex];
        uint256 refundAmount = offer.amount;
        
        // Deactivate the offer
        offer.isActive = false;
        
        // Refund the deposit
        escrowBalances[propertyId] -= refundAmount;
        payable(msg.sender).transfer(refundAmount);
    }

    function delistProperty(uint256 propertyId) external onlySeller(propertyId) propertyExists(propertyId) whenNotPaused {
        require(properties[propertyId].isListed, "Property not listed");
        
        // Refund all active offers
        for (uint256 i = 0; i < propertyOffers[propertyId].length; i++) {
            if (propertyOffers[propertyId][i].isActive) {
                propertyOffers[propertyId][i].isActive = false;
                payable(propertyOffers[propertyId][i].buyer).transfer(propertyOffers[propertyId][i].amount);
                escrowBalances[propertyId] -= propertyOffers[propertyId][i].amount;
            }
        }
        
        properties[propertyId].isListed = false;
        emit PropertyDelisted(propertyId, msg.sender);
    }

    // Expire offers
    function expireOffers(uint256 propertyId) external propertyExists(propertyId) {
        uint256 expiredCount = 0;
        for (uint256 i = 0; i < propertyOffers[propertyId].length; i++) {
            if (propertyOffers[propertyId][i].isActive && block.timestamp >= propertyOffers[propertyId][i].expiresAt) {
                propertyOffers[propertyId][i].isActive = false;
                
                // Refund expired offer
                payable(propertyOffers[propertyId][i].buyer).transfer(propertyOffers[propertyId][i].amount);
                escrowBalances[propertyId] -= propertyOffers[propertyId][i].amount;
                
                emit OfferExpired(propertyId, propertyOffers[propertyId][i].buyer, propertyOffers[propertyId][i].amount);
                expiredCount++;
            }
        }
        require(expiredCount > 0, "No expired offers found");
    }

    // Admin Functions

    // Authorize/deauthorize agent
    function setAgentAuthorization(address agent, bool authorized) external onlyOwner {
        require(agent != address(0), "Invalid agent address");
        authorizedAgents[agent] = authorized;
        emit AgentAuthorized(agent, authorized);
    }

    // Set platform fee
    function setPlatformFee(uint256 _platformFee) external onlyOwner {
        require(_platformFee <= 1000, "Platform fee too high"); // Max 10%
        platformFee = _platformFee;
    }

    // Emergency pause/unpause
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function setAppraiser(address _appraiser) external onlyOwner {
        require(_appraiser != address(0), "Invalid appraiser address");
        appraiser = _appraiser;
    }

    function withdrawEscrow(uint256 propertyId) external onlyOwner propertyExists(propertyId) nonReentrant {
        require(escrowBalances[propertyId] > 0, "No funds in escrow");
        uint256 amount = escrowBalances[propertyId];
        escrowBalances[propertyId] = 0;
        payable(msg.sender).transfer(amount);
    }

    // VIEW FUNCTIONS
    function getPropertyDetails(uint256 propertyId) external view propertyExists(propertyId) returns (Property memory) {
        return properties[propertyId];
    }

    function getPropertyOwner(uint256 propertyId) external view propertyExists(propertyId) returns (address) {
        return ownerOf(propertyId);
    }

    function getSeller(uint256 propertyId) external view propertyExists(propertyId) returns (address) {
        return properties[propertyId].seller;
    }

    function getPropertyOffers(uint256 propertyId) external view propertyExists(propertyId) returns (Offer[] memory) {
        return propertyOffers[propertyId];
    }

    function getActiveOffers(uint256 propertyId) external view propertyExists(propertyId) returns (Offer[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < propertyOffers[propertyId].length; i++) {
            if (propertyOffers[propertyId][i].isActive && block.timestamp < propertyOffers[propertyId][i].expiresAt) {
                activeCount++;
            }
        }
        
        Offer[] memory activeOffers = new Offer[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < propertyOffers[propertyId].length; i++) {
            if (propertyOffers[propertyId][i].isActive && block.timestamp < propertyOffers[propertyId][i].expiresAt) {
                activeOffers[index] = propertyOffers[propertyId][i];
                index++;
            }
        }
        
        return activeOffers;
    }

    function getPropertyTransaction(uint256 propertyId) external view propertyExists(propertyId) returns (Transaction memory) {
        return propertyTransactions[propertyId];
    }

    function getPropertyViewers(uint256 propertyId) external view propertyExists(propertyId) returns (address[] memory) {
        return propertyViewers[propertyId];
    }

    function getPropertyDocuments(uint256 propertyId) external view propertyExists(propertyId) returns (string[] memory) {
        return properties[propertyId].documents;
    }

    function getPropertiesByOwner(address owner) external view returns (uint256[] memory) {
        return ownerProperties[owner];
    }

    function getTotalProperties() external view returns (uint256) {
        return _propertyIdCounter;
    }

    function isPropertyListed(uint256 propertyId) external view propertyExists(propertyId) returns (bool) {
        return properties[propertyId].isListed;
    }

    function isPropertySold(uint256 propertyId) external view propertyExists(propertyId) returns (bool) {
        return properties[propertyId].isSold;
    }

    function getHighestBid(uint256 propertyId) external view propertyExists(propertyId) returns (uint256, address) {
        uint256 highestBid = 0;
        address highestBidder = address(0);
        
        for (uint256 i = 0; i < propertyOffers[propertyId].length; i++) {
            if (propertyOffers[propertyId][i].isActive && propertyOffers[propertyId][i].amount > highestBid) {
                highestBid = propertyOffers[propertyId][i].amount;
                highestBidder = propertyOffers[propertyId][i].buyer;
            }
        }
        
        return (highestBid, highestBidder);
    }

    function isAuctionActive(uint256 propertyId) external view propertyExists(propertyId) returns (bool) {
        return properties[propertyId].auctionEndTime > 0 && block.timestamp < properties[propertyId].auctionEndTime;
    }

    function getAuctionEndTime(uint256 propertyId) external view propertyExists(propertyId) returns (uint256) {
        return properties[propertyId].auctionEndTime;
    }
}
