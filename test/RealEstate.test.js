
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RealEstate", function () {
    let RealEstate, realEstate, owner, addr1, addr2, appraiser;
    const propertyDetails = "123 Main St";
    const price = ethers.parseEther("1");

    beforeEach(async function () {
        [owner, addr1, addr2, appraiser] = await ethers.getSigners();

        const RealEstateFactory = await ethers.getContractFactory("RealEstate");
        realEstate = await RealEstateFactory.deploy();
        await realEstate.waitForDeployment();

        await realEstate.connect(owner).setAppraiser(appraiser.address);
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await realEstate.owner()).to.equal(owner.address);
        });

        it("Should set the right appraiser", async function () {
            expect(await realEstate.appraiser()).to.equal(appraiser.address);
        });
    });

    describe("Listing Properties", function () {
        it("Should list a new property", async function () {
            await expect(realEstate.connect(addr1).listProperty(price, propertyDetails))
                .to.emit(realEstate, "PropertyListed")
                .withArgs(0, addr1.address, price, propertyDetails);

            const property = await realEstate.getPropertyDetails(0);
            expect(property.seller).to.equal(addr1.address);
            expect(property.price).to.equal(price);
            expect(property.isListed).to.be.true;
            expect(await realEstate.ownerOf(0)).to.equal(addr1.address);
        });
    });

    describe("Submitting Offers", function () {
        beforeEach(async function () {
            await realEstate.connect(addr1).listProperty(price, propertyDetails);
        });

        it("Should submit an offer", async function () {
            const offerAmount = ethers.parseEther("0.5");
            await expect(realEstate.connect(addr2).submitOffer(0, { value: offerAmount }))
                .to.emit(realEstate, "OfferSubmitted")
                .withArgs(0, addr2.address, offerAmount);

            const property = await realEstate.getPropertyDetails(0);
            expect(property.buyer).to.equal(addr2.address);
            expect(property.offerAmount).to.equal(offerAmount);
            expect(await realEstate.escrowBalances(0)).to.equal(offerAmount);
        });

        it("Should fail if property is not listed", async function () {
            await realEstate.connect(addr1).delistProperty(0);
            await expect(realEstate.connect(addr2).submitOffer(0, { value: ethers.parseEther("0.5") }))
                .to.be.revertedWith("Property not listed");
        });

        it("Should fail if no deposit is sent", async function () {
            await expect(realEstate.connect(addr2).submitOffer(0, { value: 0 }))
                .to.be.revertedWith("Deposit required");
        });

        it("Should fail if seller submits an offer", async function () {
            await expect(realEstate.connect(addr1).submitOffer(0, { value: ethers.parseEther("0.5") }))
                .to.be.revertedWith("Seller cannot submit an offer");
        });
    });

    describe("Accepting Offers", function () {
        const offerAmount = ethers.parseEther("1");
        beforeEach(async function () {
            await realEstate.connect(addr1).listProperty(price, propertyDetails);
            await realEstate.connect(addr2).submitOffer(0, { value: offerAmount });
        });

        it("Should accept an offer", async function () {
            const sellerBalanceBefore = await ethers.provider.getBalance(addr1.address);

            await expect(realEstate.connect(addr1).acceptOffer(0))
                .to.emit(realEstate, "OfferAccepted");

            const property = await realEstate.getPropertyDetails(0);
            expect(property.isSold).to.be.true;
            expect(property.isListed).to.be.false;
            expect(await realEstate.ownerOf(0)).to.equal(addr2.address);

            const sellerBalanceAfter = await ethers.provider.getBalance(addr1.address);
            expect(sellerBalanceAfter).to.be.gt(sellerBalanceBefore);
        });

        it("Should fail if not seller", async function () {
            await expect(realEstate.connect(addr2).acceptOffer(0))
                .to.be.revertedWith("Not the seller");
        });
    });

    describe("Rejecting Offers", function () {
        const offerAmount = ethers.parseEther("0.5");
        beforeEach(async function () {
            await realEstate.connect(addr1).listProperty(price, propertyDetails);
            await realEstate.connect(addr2).submitOffer(0, { value: offerAmount });
        });

        it("Should reject an offer", async function () {
            const buyerBalanceBefore = await ethers.provider.getBalance(addr2.address);
            await expect(realEstate.connect(addr1).rejectOffer(0))
                .to.emit(realEstate, "OfferRejected")
                .withArgs(0, addr2.address);

            const property = await realEstate.getPropertyDetails(0);
            expect(property.offerAmount).to.equal(0);
            expect(property.buyer).to.equal(ethers.ZeroAddress);
            expect(property.isListed).to.be.true;

            const buyerBalanceAfter = await ethers.provider.getBalance(addr2.address);
            expect(buyerBalanceAfter).to.be.gt(buyerBalanceBefore);
        });
    });

    describe("Inspections", function () {
        beforeEach(async function () {
            await realEstate.connect(addr1).listProperty(price, propertyDetails);
        });

        it("Should allow appraiser to inspect property", async function () {
            await expect(realEstate.connect(appraiser).inspectProperty(0))
                .to.emit(realEstate, "InspectionUpdated")
                .withArgs(0, true);
            const property = await realEstate.getPropertyDetails(0);
            expect(property.isInspectionPassed).to.be.true;
        });

        it("Should fail if not appraiser", async function () {
            await expect(realEstate.connect(addr1).inspectProperty(0))
                .to.be.revertedWith("Not the appraiser");
        });
    });

    describe("Financing", function () {
        beforeEach(async function () {
            await realEstate.connect(addr1).listProperty(price, propertyDetails);
        });

        it("Should approve financing", async function () {
            await expect(realEstate.connect(owner).updateFinancing(0, true))
                .to.emit(realEstate, "FinancingApproved")
                .withArgs(0);
            const property = await realEstate.getPropertyDetails(0);
            expect(property.FinancingApproved).to.be.true;
        });

        it("Should reject financing", async function () {
            await expect(realEstate.connect(owner).updateFinancing(0, false))
                .to.emit(realEstate, "FinancingRejected")
                .withArgs(0);
            const property = await realEstate.getPropertyDetails(0);
            expect(property.FinancingApproved).to.be.false;
        });
    });

    describe("Completing Transactions", function () {
        const offerAmount = ethers.parseEther("1");
        beforeEach(async function () {
            await realEstate.connect(addr1).listProperty(price, propertyDetails);
            await realEstate.connect(addr2).submitOffer(0, { value: offerAmount });
            await realEstate.connect(appraiser).inspectProperty(0);
            await realEstate.connect(owner).updateFinancing(0, true);
        });

        it("Should complete the transaction", async function () {
            const sellerBalanceBefore = await ethers.provider.getBalance(addr1.address);
            await expect(realEstate.connect(addr2).CompleteTransaction(0))
                .to.emit(realEstate, "TransactionCompleted");

            const property = await realEstate.getPropertyDetails(0);
            expect(property.isSold).to.be.true;
            expect(property.isListed).to.be.false;
            expect(await realEstate.ownerOf(0)).to.equal(addr2.address);
            const sellerBalanceAfter = await ethers.provider.getBalance(addr1.address);
            expect(sellerBalanceAfter).to.be.gt(sellerBalanceBefore);
        });
    });

    describe("Delisting Properties", function () {
        beforeEach(async function () {
            await realEstate.connect(addr1).listProperty(price, propertyDetails);
        });

        it("Should delist a property", async function () {
            await expect(realEstate.connect(addr1).delistProperty(0))
                .to.emit(realEstate, "PropertyDelisted")
                .withArgs(0, addr1.address);
            const property = await realEstate.getPropertyDetails(0);
            expect(property.isListed).to.be.false;
        });
    });

    describe("Utility Functions", function () {
        beforeEach(async function () {
            await realEstate.connect(addr1).listProperty(price, propertyDetails);
        });

        it("Should get property details", async function () {
            const property = await realEstate.getPropertyDetails(0);
            expect(property.seller).to.equal(addr1.address);
        });

        it("Should get property owner", async function () {
            const owner = await realEstate.getPropertyOwner(0);
            expect(owner).to.equal(addr1.address);
        });

        it("Should get seller", async function () {
            const seller = await realEstate.getSeller(0);
            expect(seller).to.equal(addr1.address);
        });
    });

    describe("Admin functions", function() {
        it("Should set a new appraiser", async function() {
            await realEstate.connect(owner).setAppraiser(addr2.address);
            expect(await realEstate.appraiser()).to.equal(addr2.address);
        });

        it("Should allow owner to withdraw escrow", async function() {
            await realEstate.connect(addr1).listProperty(price, propertyDetails);
            await realEstate.connect(addr2).submitOffer(0, { value: ethers.parseEther("1") });

            const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
            await realEstate.connect(owner).withdrawEscrow(0);
            const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
            expect(ownerBalanceAfter).to.be.gt(ownerBalanceBefore);
        });
    });
});
