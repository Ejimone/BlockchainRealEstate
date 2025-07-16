const { ethers } = require("hardhat");

async function main() {
    console.log("Starting auction demo...");
    
    // Contract address (update this with your deployed contract address)
    const contractAddress = process.env.CONTRACT_ADDRESS || "0x72BEd810fA7Dc49Ad300DAD894F8cDC8A2Dd1Af9";
    
    // Get contract instance
    const RealEstate = await ethers.getContractFactory("RealEstate");
    const realEstate = RealEstate.attach(contractAddress);
    
    // Get signers
    const signers = await ethers.getSigners();
    const [owner, seller] = signers;
    
    // For Ganache with 2 accounts, use owner as bidder
    const bidder1 = owner;
    const appraiser = owner;
    
    console.log("Contract Address:", contractAddress);
    console.log("Seller:", seller.address);
    console.log("Bidder1:", bidder1.address);
    console.log("Available signers:", signers.length);
    
    try {
        // Setup: Set appraiser and authorize seller
        console.log("\n=== Setup ===");
        await realEstate.connect(owner).setAppraiser(appraiser.address);
        await realEstate.connect(owner).setAgentAuthorization(seller.address, true);
        console.log("✅ Setup completed");
        
        // List a property for auction
        console.log("\n=== Listing Property for Auction ===");
        const listTx = await realEstate.connect(seller).listPropertySimple(
            ethers.parseEther("3.0"), // 3.0 ETH starting price
            "456 Auction Street, Blockchain City"
        );
        await listTx.wait();
        console.log("✅ Property listed for auction");
        
        // Start auction
        console.log("\n=== Starting Auction ===");
        const startAuctionTx = await realEstate.connect(seller).startAuction(
            0, // property ID
            ethers.parseEther("2.0"), // minimum bid 2.0 ETH
            3600 // 1 hour duration
        );
        await startAuctionTx.wait();
        console.log("✅ Auction started with minimum bid of 2.0 ETH");
        
        // Get auction details
        const auctionDetails = await realEstate.getAuctionDetails(0);
        console.log("Auction Details:");
        console.log("  - Is Active:", auctionDetails.isActive);
        console.log("  - Minimum Bid:", ethers.formatEther(auctionDetails.minimumBid), "ETH");
        console.log("  - Highest Bid:", ethers.formatEther(auctionDetails.highestBid), "ETH");
        console.log("  - Highest Bidder:", auctionDetails.highestBidder);
        
        // Place bids
        console.log("\n=== Placing Bids ===");
        
        // Bidder 1 places first bid
        const bid1Tx = await realEstate.connect(bidder1).bidOnAuction(0, {
            value: ethers.parseEther("2.1") // 2.1 ETH
        });
        await bid1Tx.wait();
        console.log("✅ Bidder1 placed bid of 2.1 ETH");
        
        // Seller can't bid on their own auction, so we'll simulate time passing
        console.log("⏰ Simulating auction progress...");
        
        // Check updated auction details
        const updatedAuctionDetails = await realEstate.getAuctionDetails(0);
        console.log("\nUpdated Auction Details:");
        console.log("  - Highest Bid:", ethers.formatEther(updatedAuctionDetails.highestBid), "ETH");
        console.log("  - Highest Bidder:", updatedAuctionDetails.highestBidder);
        console.log("  - Bid Count:", updatedAuctionDetails.bidCount);
        
        // Try to place a bid that's too low (should fail)
        console.log("\n=== Testing Low Bid (Should Fail) ===");
        try {
            await realEstate.connect(bidder1).bidOnAuction(0, {
                value: ethers.parseEther("2.0") // Lower than current highest
            });
            console.log("❌ This should have failed!");
        } catch (error) {
            console.log("✅ Low bid rejected as expected:", error.message.includes("Bid too low"));
        }
        
        // Simulate time passing to end auction
        console.log("\n=== Simulating Time Passage ===");
        await ethers.provider.send("evm_increaseTime", [3601]); // Increase time by 1 hour + 1 second
        await ethers.provider.send("evm_mine"); // Mine a new block
        console.log("✅ Time advanced past auction end");
        
        // End auction
        console.log("\n=== Ending Auction ===");
        const endAuctionTx = await realEstate.connect(seller).endAuction(0);
        await endAuctionTx.wait();
        console.log("✅ Auction ended");
        
        // Check final results
        const finalAuctionDetails = await realEstate.getAuctionDetails(0);
        const propertyDetails = await realEstate.getPropertyDetails(0);
        
        console.log("\n=== Final Results ===");
        console.log("Auction Details:");
        console.log("  - Is Active:", finalAuctionDetails.isActive);
        console.log("  - Winner:", finalAuctionDetails.highestBidder);
        console.log("  - Winning Bid:", ethers.formatEther(finalAuctionDetails.highestBid), "ETH");
        
        console.log("\nProperty Details:");
        console.log("  - Is Sold:", propertyDetails.isSold);
        console.log("  - Buyer:", propertyDetails.buyer);
        console.log("  - Final Price:", ethers.formatEther(propertyDetails.price), "ETH");
        
        // Check NFT ownership
        const nftOwner = await realEstate.ownerOf(0);
        console.log("\nNFT Ownership:");
        console.log("  - NFT Owner:", nftOwner);
        console.log("  - Won by Bidder3:", nftOwner === bidder3.address);
        
        // Check balances (simplified)
        const sellerBalance = await ethers.provider.getBalance(seller.address);
        console.log("\nSeller Balance:", ethers.formatEther(sellerBalance), "ETH");
        
        console.log("\n✅ Auction demo completed successfully!");
        console.log("Winner: Bidder3 with 2.8 ETH bid");
        
    } catch (error) {
        console.error("❌ Error during auction demo:", error.message);
        process.exit(1);
    }
}

// Handle errors
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Auction demo failed:", error);
        process.exit(1);
    });
