const { ethers } = require("hardhat");
const { initializeScript } = require("./utils/network-utils");

async function main() {
    // Initialize script with dynamic contract and accounts
    const { contract: realEstate, roles, networkInfo } = await initializeScript("Quick Interaction Test");
    
    // Extract roles
    const { owner, seller, buyer, appraiser } = roles;
    
    console.log("=== Quick Interaction Test ===");
    
    try {
        // Set appraiser
        console.log("Setting appraiser...");
        const appraiserTx = await realEstate.connect(owner.signer).setAppraiser(appraiser.address);
        await appraiserTx.wait();
        console.log("✅ Appraiser set");
        
        // Authorize seller as agent
        console.log("Authorizing agent...");
        const authTx = await realEstate.connect(owner.signer).setAgentAuthorization(seller.address, true);
        await authTx.wait();
        console.log("✅ Agent authorized");
        
        // List a property
        console.log("Listing property...");
        const listTx = await realEstate.connect(seller.signer).listPropertySimple(
            ethers.parseEther("1.5"),
            "Dynamic Test Property"
        );
        await listTx.wait();
        console.log("✅ Property listed");
        
        // Get property details
        const propertyDetails = await realEstate.getPropertyDetails(0);
        console.log("Property price:", ethers.formatEther(propertyDetails.price), "ETH");
        console.log("Property location:", propertyDetails.location);
        
        // Submit and accept offer
        console.log("Submitting offer...");
        const offerTx = await realEstate.connect(buyer.signer).submitOfferSimple(0, {
            value: ethers.parseEther("1.4")
        });
        await offerTx.wait();
        console.log("✅ Offer submitted");
        
        console.log("Accepting offer...");
        const acceptTx = await realEstate.connect(seller.signer).acceptOffer(0, buyer.address);
        await acceptTx.wait();
        console.log("✅ Offer accepted");
        
        // Check final state
        const finalProperty = await realEstate.getPropertyDetails(0);
        console.log("Property sold:", finalProperty.isSold);
        console.log("New owner:", finalProperty.buyer);
        
        console.log("\n✅ Dynamic system working perfectly!");
        
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
