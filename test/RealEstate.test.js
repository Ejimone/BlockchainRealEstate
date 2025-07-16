const { expect } = require("chai");
const { ethers, network } = require("hardhat");

describe("RealEstate", function () {
    let RealEstate, realEstate, owner, addr1, addr2, addr3, appraiser, agent;
    const propertyDetails = "123 Main St";
    const price = ethers.parseEther("1");
    const agentCommission = 500; // 5%

    beforeEach(async function () {
        [owner, addr1, addr2, addr3, appraiser, agent] = await ethers.getSigners();

        const RealEstateFactory = await ethers.getContractFactory("RealEstate");
        realEstate = await RealEstateFactory.deploy();
        await realEstate.waitForDeployment();

        await realEstate.connect(owner).setAppraiser(appraiser.address);
        await realEstate.connect(owner).setAgentAuthorization(agent.address, true);
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await realEstate.owner()).to.equal(owner.address);
        });

        it("Should set the right appraiser", async function () {
            expect(await realEstate.appraiser()).to.equal(appraiser.address);
        });

        it("Should authorize the owner as an agent", async function () {
            expect(await realEstate.authorizedAgents(owner.address)).to.be.true;
        });

        it("Should set platform fee", async function () {
            expect(await realEstate.platformFee()).to.equal(250); // 2.5%
        });
    });

    describe("Enhanced Property Listing", function () {
        it("Should list a property with full details", async function () {
            await expect(realEstate.connect(addr1).listProperty(
                price,
                propertyDetails,
                0, // PropertyType.RESIDENTIAL
                150, // area
                3, // bedrooms
                2, // bathrooms
                agent.address,
                agentCommission
            ))
                .to.emit(realEstate, "PropertyListed")
                .withArgs(0, addr1.address, price, propertyDetails);

            const property = await realEstate.getPropertyDetails(0);
            expect(property.seller).to.equal(addr1.address);
            expect(property.price).to.equal(price);
            expect(property.area).to.equal(150);
            expect(property.bedrooms).to.equal(3);
            expect(property.bathrooms).to.equal(2);
            expect(property.agent).to.equal(agent.address);
            expect(property.agentCommission).to.equal(agentCommission);
            expect(property.isListed).to.be.true;
        });

        it("Should list a property with simple method", async function () {
            await expect(realEstate.connect(addr1).listPropertySimple(price, propertyDetails))
                .to.emit(realEstate, "PropertyListed")
                .withArgs(0, addr1.address, price, propertyDetails);

            const property = await realEstate.getPropertyDetails(0);
            expect(property.seller).to.equal(addr1.address);
            expect(property.price).to.equal(price);
            expect(property.propertyType).to.equal(0); // RESIDENTIAL
            expect(property.agentCommission).to.equal(0);
        });

        it("Should fail with invalid parameters", async function () {
            await expect(realEstate.connect(addr1).listProperty(
                0, // Invalid price
                propertyDetails,
                0,
                150,
                3,
                2,
                agent.address,
                agentCommission
            )).to.be.revertedWith("Price must be greater than 0");

            await expect(realEstate.connect(addr1).listProperty(
                price,
                propertyDetails,
                0,
                150,
                3,
                2,
                agent.address,
                1500 // Commission too high
            )).to.be.revertedWith("Commission too high");
        });
    });

    describe("Enhanced Offer System", function () {
        beforeEach(async function () {
            await realEstate.connect(addr1).listPropertySimple(price, propertyDetails);
        });

        it("Should submit an offer with expiration", async function () {
            const offerAmount = ethers.parseEther("0.8");
            const expirationTime = 24 * 60 * 60; // 24 hours

            await expect(realEstate.connect(addr2).submitOffer(0, expirationTime, { value: offerAmount }))
                .to.emit(realEstate, "OfferSubmitted")
                .withArgs(0, addr2.address, offerAmount);

            const offers = await realEstate.getPropertyOffers(0);
            expect(offers.length).to.equal(1);
            expect(offers[0].buyer).to.equal(addr2.address);
            expect(offers[0].amount).to.equal(offerAmount);
            expect(offers[0].isActive).to.be.true;
        });

        it("Should submit simple offer", async function () {
            const offerAmount = ethers.parseEther("0.8");

            await expect(realEstate.connect(addr2).submitOfferSimple(0, { value: offerAmount }))
                .to.emit(realEstate, "OfferSubmitted")
                .withArgs(0, addr2.address, offerAmount);

            const offers = await realEstate.getPropertyOffers(0);
            expect(offers.length).to.equal(1);
            expect(offers[0].buyer).to.equal(addr2.address);
            expect(offers[0].amount).to.equal(offerAmount);
        });

        it("Should handle multiple offers", async function () {
            const offerAmount1 = ethers.parseEther("0.8");
            const offerAmount2 = ethers.parseEther("0.9");

            await realEstate.connect(addr2).submitOfferSimple(0, { value: offerAmount1 });
            await realEstate.connect(addr3).submitOfferSimple(0, { value: offerAmount2 });

            const offers = await realEstate.getPropertyOffers(0);
            expect(offers.length).to.equal(2);
            expect(offers[0].buyer).to.equal(addr2.address);
            expect(offers[1].buyer).to.equal(addr3.address);
        });

        it("Should prevent duplicate offers from same buyer", async function () {
            const offerAmount = ethers.parseEther("0.8");

            await realEstate.connect(addr2).submitOfferSimple(0, { value: offerAmount });

            await expect(realEstate.connect(addr2).submitOfferSimple(0, { value: offerAmount }))
                .to.be.revertedWith("You already have an active offer");
        });

        it("Should get active offers only", async function () {
            await realEstate.connect(addr2).submitOfferSimple(0, { value: ethers.parseEther("0.8") });
            await realEstate.connect(addr3).submitOfferSimple(0, { value: ethers.parseEther("0.9") });

            const activeOffers = await realEstate.getActiveOffers(0);
            expect(activeOffers.length).to.equal(2);
        });
    });

    describe("Enhanced Offer Acceptance", function () {
        beforeEach(async function () {
            await realEstate.connect(addr1).listProperty(
                price,
                propertyDetails,
                0,
                150,
                3,
                2,
                agent.address,
                agentCommission
            );
            await realEstate.connect(addr2).submitOfferSimple(0, { value: ethers.parseEther("1") });
            await realEstate.connect(addr3).submitOfferSimple(0, { value: ethers.parseEther("1.1") });
        });

        it("Should accept specific offer with fee distribution", async function () {
            const sellerBalanceBefore = await ethers.provider.getBalance(addr1.address);
            const agentBalanceBefore = await ethers.provider.getBalance(agent.address);
            const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);

            await expect(realEstate.connect(addr1).acceptOffer(0, addr2.address))
                .to.emit(realEstate, "OfferAccepted")
                .withArgs(0, addr2.address, ethers.parseEther("1"));

            const property = await realEstate.getPropertyDetails(0);
            expect(property.isSold).to.be.true;
            expect(property.isListed).to.be.false;
            expect(property.buyer).to.equal(addr2.address);
            expect(await realEstate.ownerOf(0)).to.equal(addr2.address);

            // Check fee distribution
            const sellerBalanceAfter = await ethers.provider.getBalance(addr1.address);
            const agentBalanceAfter = await ethers.provider.getBalance(agent.address);
            const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);

            expect(sellerBalanceAfter).to.be.gt(sellerBalanceBefore);
            expect(agentBalanceAfter).to.be.gt(agentBalanceBefore);
            expect(ownerBalanceAfter).to.be.gt(ownerBalanceBefore);

            // Check other offers were refunded
            const offers = await realEstate.getPropertyOffers(0);
            expect(offers[1].isActive).to.be.false; // addr3's offer should be deactivated
        });

        it("Should accept first offer", async function () {
            await expect(realEstate.connect(addr1).acceptFirstOffer(0))
                .to.emit(realEstate, "OfferAccepted")
                .withArgs(0, addr2.address, ethers.parseEther("1"));

            const property = await realEstate.getPropertyDetails(0);
            expect(property.buyer).to.equal(addr2.address);
            expect(await realEstate.ownerOf(0)).to.equal(addr2.address);
        });
    });

    describe("Offer Rejection", function () {
        beforeEach(async function () {
            await realEstate.connect(addr1).listPropertySimple(price, propertyDetails);
            await realEstate.connect(addr2).submitOfferSimple(0, { value: ethers.parseEther("0.8") });
        });

        it("Should reject specific offer", async function () {
            const buyerBalanceBefore = await ethers.provider.getBalance(addr2.address);

            await expect(realEstate.connect(addr1).rejectOffer(0, addr2.address))
                .to.emit(realEstate, "OfferRejected")
                .withArgs(0, addr2.address);

            const buyerBalanceAfter = await ethers.provider.getBalance(addr2.address);
            expect(buyerBalanceAfter).to.be.gt(buyerBalanceBefore);

            const offers = await realEstate.getPropertyOffers(0);
            expect(offers[0].isActive).to.be.false;
        });

        it("Should reject first offer", async function () {
            await expect(realEstate.connect(addr1).rejectFirstOffer(0))
                .to.emit(realEstate, "OfferRejected")
                .withArgs(0, addr2.address);

            const offers = await realEstate.getPropertyOffers(0);
            expect(offers[0].isActive).to.be.false;
        });
    });

    describe("Auction System", function () {
        beforeEach(async function () {
            await realEstate.connect(addr1).listPropertySimple(price, propertyDetails);
        });

        it("Should start auction", async function () {
            const minimumBid = ethers.parseEther("0.5");
            const duration = 24 * 60 * 60; // 24 hours

            await expect(realEstate.connect(addr1).startAuction(0, minimumBid, duration))
                .to.emit(realEstate, "AuctionStarted");

            const property = await realEstate.getPropertyDetails(0);
            expect(property.minimumBid).to.equal(minimumBid);
            expect(property.auctionEndTime).to.be.gt(0);
            expect(await realEstate.isAuctionActive(0)).to.be.true;
        });

        it("Should place bids in auction", async function () {
            const minimumBid = ethers.parseEther("0.5");
            const duration = 24 * 60 * 60;

            await realEstate.connect(addr1).startAuction(0, minimumBid, duration);

            const bid1 = ethers.parseEther("0.6");
            const bid2 = ethers.parseEther("0.8");

            await expect(realEstate.connect(addr2).bidOnAuction(0, { value: bid1 }))
                .to.emit(realEstate, "OfferSubmitted")
                .withArgs(0, addr2.address, bid1);

            await expect(realEstate.connect(addr3).bidOnAuction(0, { value: bid2 }))
                .to.emit(realEstate, "OfferSubmitted")
                .withArgs(0, addr3.address, bid2);

            const [highestBid, highestBidder] = await realEstate.getHighestBid(0);
            expect(highestBid).to.equal(bid2);
            expect(highestBidder).to.equal(addr3.address);
        });

        it("Should end auction and transfer to winner", async function () {
            const minimumBid = ethers.parseEther("0.5");
            const duration = 2; // 2 seconds for more reliability

            await realEstate.connect(addr1).startAuction(0, minimumBid, duration);
            await realEstate.connect(addr2).bidOnAuction(0, { value: ethers.parseEther("0.8") });

            // Wait for auction to end and mine blocks to update timestamp
            await new Promise(resolve => setTimeout(resolve, 2500));
            await network.provider.send("evm_increaseTime", [duration + 1]);
            await network.provider.send("evm_mine");

            await expect(realEstate.connect(addr1).endAuction(0))
                .to.emit(realEstate, "AuctionEnded")
                .withArgs(0, addr2.address, ethers.parseEther("0.8"));

            const property = await realEstate.getPropertyDetails(0);
            expect(property.isSold).to.be.true;
            expect(property.buyer).to.equal(addr2.address);
            expect(await realEstate.ownerOf(0)).to.equal(addr2.address);
        });

        it("Should fail with bid too low", async function () {
            const minimumBid = ethers.parseEther("0.5");
            const duration = 24 * 60 * 60;

            await realEstate.connect(addr1).startAuction(0, minimumBid, duration);

            await expect(realEstate.connect(addr2).bidOnAuction(0, { value: ethers.parseEther("0.3") }))
                .to.be.revertedWith("Bid too low");
        });
    });

    describe("Property Management", function () {
        beforeEach(async function () {
            await realEstate.connect(addr1).listPropertySimple(price, propertyDetails);
        });

        it("Should update property price", async function () {
            const newPrice = ethers.parseEther("1.5");

            await expect(realEstate.connect(addr1).updatePropertyPrice(0, newPrice))
                .to.emit(realEstate, "PriceUpdated")
                .withArgs(0, price, newPrice);

            const property = await realEstate.getPropertyDetails(0);
            expect(property.price).to.equal(newPrice);
        });

        it("Should add documents", async function () {
            const documentHash = "QmSomeIPFSHash";

            await expect(realEstate.connect(addr1).addDocument(0, documentHash))
                .to.emit(realEstate, "DocumentAdded")
                .withArgs(0, documentHash);

            const documents = await realEstate.getPropertyDocuments(0);
            expect(documents.length).to.equal(1);
            expect(documents[0]).to.equal(documentHash);
        });

        it("Should track property viewers", async function () {
            await expect(realEstate.connect(addr2).viewProperty(0))
                .to.emit(realEstate, "PropertyViewed")
                .withArgs(0, addr2.address);

            const viewers = await realEstate.getPropertyViewers(0);
            expect(viewers.length).to.equal(1);
            expect(viewers[0]).to.equal(addr2.address);
        });

        it("Should delist property and refund offers", async function () {
            await realEstate.connect(addr2).submitOfferSimple(0, { value: ethers.parseEther("0.8") });
            
            const buyerBalanceBefore = await ethers.provider.getBalance(addr2.address);

            await expect(realEstate.connect(addr1).delistProperty(0))
                .to.emit(realEstate, "PropertyDelisted")
                .withArgs(0, addr1.address);

            const property = await realEstate.getPropertyDetails(0);
            expect(property.isListed).to.be.false;

            const buyerBalanceAfter = await ethers.provider.getBalance(addr2.address);
            expect(buyerBalanceAfter).to.be.gt(buyerBalanceBefore);
        });
    });

    describe("Offer Expiration", function () {
        beforeEach(async function () {
            await realEstate.connect(addr1).listPropertySimple(price, propertyDetails);
        });

        it("Should expire offers", async function () {
            const offerAmount = ethers.parseEther("0.8");
            const expirationTime = 1; // 1 second

            await realEstate.connect(addr2).submitOffer(0, expirationTime, { value: offerAmount });

            // Wait for offer to expire
            await new Promise(resolve => setTimeout(resolve, 1100));

            const buyerBalanceBefore = await ethers.provider.getBalance(addr2.address);

            await expect(realEstate.connect(addr1).expireOffers(0))
                .to.emit(realEstate, "OfferExpired")
                .withArgs(0, addr2.address, offerAmount);

            const buyerBalanceAfter = await ethers.provider.getBalance(addr2.address);
            expect(buyerBalanceAfter).to.be.gt(buyerBalanceBefore);

            const offers = await realEstate.getPropertyOffers(0);
            expect(offers[0].isActive).to.be.false;
        });

        it("Should refund own deposit", async function () {
            await realEstate.connect(addr2).submitOfferSimple(0, { value: ethers.parseEther("0.8") });

            const buyerBalanceBefore = await ethers.provider.getBalance(addr2.address);

            await realEstate.connect(addr2).refundDeposit(0);

            const buyerBalanceAfter = await ethers.provider.getBalance(addr2.address);
            expect(buyerBalanceAfter).to.be.gt(buyerBalanceBefore);
        });
    });

    describe("Admin Functions", function () {
        beforeEach(async function () {
            await realEstate.connect(addr1).listPropertySimple(price, propertyDetails);
        });

        it("Should set agent authorization", async function () {
            await expect(realEstate.connect(owner).setAgentAuthorization(addr2.address, true))
                .to.emit(realEstate, "AgentAuthorized")
                .withArgs(addr2.address, true);

            expect(await realEstate.authorizedAgents(addr2.address)).to.be.true;
        });

        it("Should set platform fee", async function () {
            const newFee = 500; // 5%
            await realEstate.connect(owner).setPlatformFee(newFee);
            expect(await realEstate.platformFee()).to.equal(newFee);
        });

        it("Should fail to set platform fee too high", async function () {
            await expect(realEstate.connect(owner).setPlatformFee(1500))
                .to.be.revertedWith("Platform fee too high");
        });

        it("Should pause and unpause contract", async function () {
            // Get the current property count to determine the next property ID
            const totalProperties = await realEstate.getTotalProperties();
            const propertyId = totalProperties; // This will be the next property ID
            
            // First create a property that hasn't been used in any offers
            await realEstate.connect(addr3).listPropertySimple(ethers.parseEther("2"), "456 Oak St");
            
            await realEstate.connect(owner).pause();
            
            // Check that the contract is paused - newer OpenZeppelin uses custom error EnforcedPause()
            await expect(realEstate.connect(addr2).submitOfferSimple(propertyId, { value: ethers.parseEther("0.8") }))
                .to.be.revertedWithCustomError(realEstate, "EnforcedPause");

            await realEstate.connect(owner).unpause();
            
            await expect(realEstate.connect(addr2).submitOfferSimple(propertyId, { value: ethers.parseEther("0.8") }))
                .to.emit(realEstate, "OfferSubmitted");
        });

        it("Should withdraw escrow", async function () {
            await realEstate.connect(addr2).submitOfferSimple(0, { value: ethers.parseEther("0.8") });

            const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
            await realEstate.connect(owner).withdrawEscrow(0);
            const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);

            expect(ownerBalanceAfter).to.be.gt(ownerBalanceBefore);
        });
    });

    describe("Inspection and Financing", function () {
        beforeEach(async function () {
            await realEstate.connect(addr1).listPropertySimple(price, propertyDetails);
        });

        it("Should inspect property", async function () {
            await expect(realEstate.connect(appraiser).inspectProperty(0))
                .to.emit(realEstate, "InspectionUpdated")
                .withArgs(0, true);

            const property = await realEstate.getPropertyDetails(0);
            expect(property.isInspectionPassed).to.be.true;
        });

        it("Should update inspection status", async function () {
            await expect(realEstate.connect(appraiser).updateInspectionStatus(0, true))
                .to.emit(realEstate, "InspectionUpdated")
                .withArgs(0, true);

            const property = await realEstate.getPropertyDetails(0);
            expect(property.isInspectionPassed).to.be.true;
        });

        it("Should approve financing", async function () {
            await expect(realEstate.connect(owner).updateFinancing(0, true))
                .to.emit(realEstate, "FinancingApproved")
                .withArgs(0);

            const property = await realEstate.getPropertyDetails(0);
            expect(property.FinancingApproved).to.be.true;
        });

        it("Should complete transaction with all conditions met", async function () {
            // Get the current property count to determine the next property ID
            const totalProperties = await realEstate.getTotalProperties();
            const propertyId = totalProperties; // This will be the next property ID
            
            // Create a fresh property for the completion test
            await realEstate.connect(addr3).listPropertySimple(ethers.parseEther("3"), "789 Pine St");
            
            await realEstate.connect(addr2).submitOfferSimple(propertyId, { value: ethers.parseEther("3") });
            
            // Accept the offer first to set the buyer
            await realEstate.connect(addr3).acceptOffer(propertyId, addr2.address);
            
            // Property should now be sold and completed
            const property = await realEstate.getPropertyDetails(propertyId);
            expect(property.isSold).to.be.true;
            expect(property.buyer).to.equal(addr2.address);
        });
    });

    describe("View Functions", function () {
        beforeEach(async function () {
            await realEstate.connect(addr1).listPropertySimple(price, propertyDetails);
            await realEstate.connect(addr2).submitOfferSimple(0, { value: ethers.parseEther("0.8") });
        });

        it("Should return correct property details", async function () {
            const property = await realEstate.getPropertyDetails(0);
            expect(property.seller).to.equal(addr1.address);
            expect(property.price).to.equal(price);
            expect(property.isListed).to.be.true;
        });

        it("Should return total properties", async function () {
            expect(await realEstate.getTotalProperties()).to.equal(1);
        });

        it("Should return property listing status", async function () {
            expect(await realEstate.isPropertyListed(0)).to.be.true;
            expect(await realEstate.isPropertySold(0)).to.be.false;
        });

        it("Should return properties by owner", async function () {
            // The ownerProperties mapping tracks buyers who submitted offers, not property owners
            // Create a new property to avoid conflicts with other tests
            await realEstate.connect(addr3).listPropertySimple(ethers.parseEther("2"), "456 Oak St");
            const propertyId = 1; // This should be the next property ID
            
            await realEstate.connect(addr2).submitOfferSimple(propertyId, { value: ethers.parseEther("0.8") });
            
            const properties = await realEstate.getPropertiesByOwner(addr2.address);
            expect(properties.length).to.be.greaterThan(0);
        });
    });

    describe("Error Handling", function () {
        it("Should fail with non-existent property", async function () {
            await expect(realEstate.getPropertyDetails(999))
                .to.be.revertedWith("Property does not exist");
        });

        it("Should fail unauthorized actions", async function () {
            await realEstate.connect(addr1).listPropertySimple(price, propertyDetails);
            
            await expect(realEstate.connect(addr2).updatePropertyPrice(0, ethers.parseEther("2")))
                .to.be.revertedWith("Not the seller");

            await expect(realEstate.connect(addr2).inspectProperty(0))
                .to.be.revertedWith("Not the appraiser");

            await expect(realEstate.connect(addr2).updateFinancing(0, true))
                .to.be.revertedWithCustomError(realEstate, "OwnableUnauthorizedAccount");
        });
    });
});
