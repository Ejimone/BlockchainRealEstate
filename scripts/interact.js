const { ethers } = require("hardhat");

async function main() {
    console.log("Starting RealEstate contract interaction...");
    
    // Contract address (update this with your deployed contract address)
    const contractAddress = process.env.CONTRACT_ADDRESS || "0x72BEd810fA7Dc49Ad300DAD894F8cDC8A2Dd1Af9";
    
    // Get contract instance
    const RealEstate = await ethers.getContractFactory("RealEstate");
    const realEstate = RealEstate.attach(contractAddress);
    
    // Get signers
    const signers = await ethers.getSigners();
    const [owner, user1] = signers;
    
    // Use available signers, assign roles appropriately
    const seller = user1; // user1 will be the seller
    const buyer = owner;  // owner will be the buyer
    const appraiser = owner; // owner will also be the appraiser
    
    console.log("Contract Address:", contractAddress);
    console.log("Owner:", owner.address);
    console.log("Seller:", seller.address);
    console.log("Buyer:", buyer.address);
    console.log("Appraiser:", appraiser.address);
    console.log("Available signers:", signers.length);
    
    try {
        // Set appraiser
        console.log("\n=== Setting Appraiser ===");
        const setAppraisertx = await realEstate.connect(owner).setAppraiser(appraiser.address);
        await setAppraisertx.wait();
        console.log("✅ Appraiser set to:", appraiser.address);
        
        // Authorize seller as agent
        console.log("\n=== Authorizing Agent ===");
        const authTx = await realEstate.connect(owner).setAgentAuthorization(seller.address, true);
        await authTx.wait();
        console.log("✅ Agent authorized:", seller.address);
        
        // List a property
        console.log("\n=== Listing Property ===");
        const listTx = await realEstate.connect(seller).listPropertySimple(
            ethers.parseEther("2.5"), // 2.5 ETH
            "123 Blockchain Avenue, DeFi City"
        );
        await listTx.wait();
        console.log("✅ Property listed successfully");
        
        // Get property details
        const propertyDetails = await realEstate.getPropertyDetails(0);
        console.log("Property Details:");
        console.log("  - Price:", ethers.formatEther(propertyDetails.price), "ETH");
        console.log("  - Location:", propertyDetails.location);
        console.log("  - Seller:", propertyDetails.seller);
        console.log("  - Is Listed:", propertyDetails.isListed);
        
        // Submit an offer
        console.log("\n=== Submitting Offer ===");
        const offerTx = await realEstate.connect(buyer).submitOfferSimple(0, {
            value: ethers.parseEther("2.3") // 2.3 ETH offer
        });
        await offerTx.wait();
        console.log("✅ Offer submitted successfully");
        
        // Get active offers
        const activeOffers = await realEstate.getActiveOffers(0);
        console.log("Active Offers Count:", activeOffers.length);
        if (activeOffers.length > 0) {
            console.log("First Offer:");
            console.log("  - Buyer:", activeOffers[0].buyer);
            console.log("  - Amount:", ethers.formatEther(activeOffers[0].amount), "ETH");
        }
        
        // Accept the offer
        console.log("\n=== Accepting Offer ===");
        const acceptTx = await realEstate.connect(seller).acceptOffer(0, buyer.address);
        await acceptTx.wait();
        console.log("✅ Offer accepted successfully");
        
        // Check if property is sold
        const updatedProperty = await realEstate.getPropertyDetails(0);
        console.log("Property Status:");
        console.log("  - Is Sold:", updatedProperty.isSold);
        console.log("  - Buyer:", updatedProperty.buyer);
        console.log("  - Is Listed:", updatedProperty.isListed);
        
        // Check NFT ownership
        console.log("\n=== NFT Ownership ===");
        const nftOwner = await realEstate.ownerOf(0);
        console.log("NFT Owner:", nftOwner);
        console.log("NFT transferred to buyer:", nftOwner === buyer.address);
        
        // Get total properties
        const totalProperties = await realEstate.getTotalProperties();
        console.log("\n=== Summary ===");
        console.log("Total Properties:", totalProperties);
        console.log("Properties by Owner:", await realEstate.getPropertiesByOwner(seller.address));
        
        console.log("\n✅ Interaction completed successfully!");
        
    } catch (error) {
        console.error("❌ Error during interaction:", error.message);
        process.exit(1);
    }
}

// Handle errors
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Script failed:", error);
        process.exit(1);
    });
