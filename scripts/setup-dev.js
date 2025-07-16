const { ethers } = require("hardhat");

async function main() {
    console.log("Setting up RealEstate contract for development...");
    
    // Contract address (update this with your deployed contract address)
    const contractAddress = process.env.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    
    // Get contract instance
    const RealEstate = await ethers.getContractFactory("RealEstate");
    const realEstate = RealEstate.attach(contractAddress);
    
    // Get signers
    const [owner, appraiser, agent1, agent2, seller1, seller2, buyer1, buyer2] = await ethers.getSigners();
    
    console.log("Contract Address:", contractAddress);
    console.log("Owner:", owner.address);
    console.log("Appraiser:", appraiser.address);
    console.log("Agent1:", agent1.address);
    console.log("Agent2:", agent2.address);
    
    try {
        // Step 1: Set up roles
        console.log("\n=== Setting Up Roles ===");
        
        // Set appraiser
        const setAppraisertx = await realEstate.connect(owner).setAppraiser(appraiser.address);
        await setAppraisertx.wait();
        console.log("✅ Appraiser set to:", appraiser.address);
        
        // Authorize agents
        const authAgent1Tx = await realEstate.connect(owner).setAgentAuthorization(agent1.address, true);
        await authAgent1Tx.wait();
        console.log("✅ Agent1 authorized:", agent1.address);
        
        const authAgent2Tx = await realEstate.connect(owner).setAgentAuthorization(agent2.address, true);
        await authAgent2Tx.wait();
        console.log("✅ Agent2 authorized:", agent2.address);
        
        // Authorize sellers as agents (so they can list properties)
        const authSeller1Tx = await realEstate.connect(owner).setAgentAuthorization(seller1.address, true);
        await authSeller1Tx.wait();
        console.log("✅ Seller1 authorized as agent:", seller1.address);
        
        const authSeller2Tx = await realEstate.connect(owner).setAgentAuthorization(seller2.address, true);
        await authSeller2Tx.wait();
        console.log("✅ Seller2 authorized as agent:", seller2.address);
        
        // Step 2: Create sample properties
        console.log("\n=== Creating Sample Properties ===");
        
        // Property 1: Residential property
        const listProperty1Tx = await realEstate.connect(seller1).listProperty(
            ethers.parseEther("2.5"), // 2.5 ETH
            "123 Blockchain Avenue, DeFi City",
            0, // RESIDENTIAL
            1500, // 1500 sq ft
            3, // 3 bedrooms
            2, // 2 bathrooms
            agent1.address,
            500 // 5% commission
        );
        await listProperty1Tx.wait();
        console.log("✅ Property 1 listed: Residential house");
        
        // Property 2: Commercial property
        const listProperty2Tx = await realEstate.connect(seller2).listProperty(
            ethers.parseEther("5.0"), // 5.0 ETH
            "456 Business District, Smart Contract City",
            1, // COMMERCIAL
            3000, // 3000 sq ft
            0, // 0 bedrooms (commercial)
            2, // 2 bathrooms
            agent2.address,
            300 // 3% commission
        );
        await listProperty2Tx.wait();
        console.log("✅ Property 2 listed: Commercial space");
        
        // Property 3: Simple listing
        const listProperty3Tx = await realEstate.connect(seller1).listPropertySimple(
            ethers.parseEther("1.8"), // 1.8 ETH
            "789 Starter Home Lane, Crypto Valley"
        );
        await listProperty3Tx.wait();
        console.log("✅ Property 3 listed: Simple listing");
        
        // Property 4: Auction property
        const listProperty4Tx = await realEstate.connect(seller2).listPropertySimple(
            ethers.parseEther("3.0"), // 3.0 ETH
            "101 Auction Street, Bidding Boulevard"
        );
        await listProperty4Tx.wait();
        console.log("✅ Property 4 listed: For auction");
        
        // Step 3: Set up inspection and add documents
        console.log("\n=== Setting Up Property Details ===");
        
        // Inspect property 1
        const inspectTx = await realEstate.connect(appraiser).inspectProperty(0);
        await inspectTx.wait();
        console.log("✅ Property 1 inspected");
        
        // Add documents to property 1
        const addDocTx = await realEstate.connect(seller1).addDocument(
            0,
            "Property Title Deed",
            "https://ipfs.io/ipfs/QmTitle123"
        );
        await addDocTx.wait();
        console.log("✅ Document added to Property 1");
        
        // Step 4: Create sample offers
        console.log("\n=== Creating Sample Offers ===");
        
        // Offer on property 1
        const offer1Tx = await realEstate.connect(buyer1).submitOfferSimple(0, {
            value: ethers.parseEther("2.3") // 2.3 ETH offer
        });
        await offer1Tx.wait();
        console.log("✅ Buyer1 made offer on Property 1");
        
        // Another offer on property 1
        const offer2Tx = await realEstate.connect(buyer2).submitOfferSimple(0, {
            value: ethers.parseEther("2.4") // 2.4 ETH offer
        });
        await offer2Tx.wait();
        console.log("✅ Buyer2 made offer on Property 1");
        
        // Offer on property 2
        const offer3Tx = await realEstate.connect(buyer1).submitOfferSimple(1, {
            value: ethers.parseEther("4.5") // 4.5 ETH offer
        });
        await offer3Tx.wait();
        console.log("✅ Buyer1 made offer on Property 2");
        
        // Step 5: Start auction for property 4
        console.log("\n=== Starting Auction ===");
        
        const startAuctionTx = await realEstate.connect(seller2).startAuction(
            3, // Property 4
            ethers.parseEther("2.0"), // Minimum bid 2.0 ETH
            7200 // 2 hours duration
        );
        await startAuctionTx.wait();
        console.log("✅ Auction started for Property 4");
        
        // Step 6: Accept an offer
        console.log("\n=== Accepting Offer ===");
        
        const acceptTx = await realEstate.connect(seller1).acceptOffer(0, buyer2.address);
        await acceptTx.wait();
        console.log("✅ Offer accepted for Property 1");
        
        // Step 7: Display setup summary
        console.log("\n=== Development Setup Summary ===");
        
        const totalProperties = await realEstate.getTotalProperties();
        console.log("Total Properties:", totalProperties);
        
        // Show property details
        for (let i = 0; i < totalProperties; i++) {
            const property = await realEstate.getPropertyDetails(i);
            console.log(`\nProperty ${i}:`);
            console.log("  - Price:", ethers.formatEther(property.price), "ETH");
            console.log("  - Location:", property.location);
            console.log("  - Seller:", property.seller);
            console.log("  - Is Listed:", property.isListed);
            console.log("  - Is Sold:", property.isSold);
            console.log("  - Buyer:", property.buyer);
            
            // Check for active offers
            const activeOffers = await realEstate.getActiveOffers(i);
            console.log("  - Active Offers:", activeOffers.length);
            
            // Check for auction
            try {
                const auctionDetails = await realEstate.getAuctionDetails(i);
                if (auctionDetails.isActive) {
                    console.log("  - Auction Active: YES");
                    console.log("  - Minimum Bid:", ethers.formatEther(auctionDetails.minimumBid), "ETH");
                }
            } catch (error) {
                // No auction for this property
            }
        }
        
        // Display account balances
        console.log("\n=== Account Balances ===");
        const accounts = [
            { name: "Owner", address: owner.address },
            { name: "Appraiser", address: appraiser.address },
            { name: "Agent1", address: agent1.address },
            { name: "Agent2", address: agent2.address },
            { name: "Seller1", address: seller1.address },
            { name: "Seller2", address: seller2.address },
            { name: "Buyer1", address: buyer1.address },
            { name: "Buyer2", address: buyer2.address }
        ];
        
        for (const account of accounts) {
            const balance = await ethers.provider.getBalance(account.address);
            console.log(`${account.name}: ${ethers.formatEther(balance)} ETH`);
        }
        
        // Next steps
        console.log("\n=== Next Steps ===");
        console.log("1. Place bids on the auction (Property 4)");
        console.log("2. Accept offers on other properties");
        console.log("3. Test rejection of offers");
        console.log("4. Test property management functions");
        console.log("5. Test pause/unpause functionality");
        
        console.log("\n✅ Development setup completed successfully!");
        
    } catch (error) {
        console.error("❌ Setup failed:", error.message);
        process.exit(1);
    }
}

// Handle errors
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Setup script failed:", error);
        process.exit(1);
    });
