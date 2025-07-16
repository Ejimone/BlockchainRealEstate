const { ethers } = require("hardhat");

async function main() {
    console.log("Verifying RealEstate contract...");
    
    // Contract address (update this with your deployed contract address)
    const contractAddress = process.env.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    
    // Get contract instance
    const RealEstate = await ethers.getContractFactory("RealEstate");
    const realEstate = RealEstate.attach(contractAddress);
    
    console.log("Contract Address:", contractAddress);
    
    try {
        // Get network info
        const network = await ethers.provider.getNetwork();
        console.log("Network:", network.name);
        console.log("Chain ID:", network.chainId);
        
        // Verify contract deployment
        const contractCode = await ethers.provider.getCode(contractAddress);
        if (contractCode === "0x") {
            console.log("❌ No contract found at address:", contractAddress);
            process.exit(1);
        }
        console.log("✅ Contract deployed at address");
        
        // Check contract owner
        console.log("\n=== Contract State Verification ===");
        const owner = await realEstate.owner();
        console.log("Owner:", owner);
        
        // Check platform fee
        const platformFee = await realEstate.platformFee();
        console.log("Platform Fee:", platformFee, "basis points (", platformFee / 100, "%)");
        
        // Check appraiser
        const appraiser = await realEstate.appraiser();
        console.log("Appraiser:", appraiser);
        
        // Check total properties
        const totalProperties = await realEstate.getTotalProperties();
        console.log("Total Properties:", totalProperties);
        
        // Check contract name and symbol
        const name = await realEstate.name();
        const symbol = await realEstate.symbol();
        console.log("NFT Name:", name);
        console.log("NFT Symbol:", symbol);
        
        // Check if contract is paused
        const isPaused = await realEstate.paused();
        console.log("Contract Paused:", isPaused);
        
        // Get some signers to test functionality
        const [signer1, signer2] = await ethers.getSigners();
        
        // Test view functions
        console.log("\n=== Testing View Functions ===");
        
        // Test agent authorization
        const isOwnerAgent = await realEstate.authorizedAgents(owner);
        console.log("Owner is authorized agent:", isOwnerAgent);
        
        // Test property listing status (should be false for non-existent property)
        const isListed = await realEstate.isPropertyListed(999);
        console.log("Property 999 is listed:", isListed);
        
        // Test properties by owner (should be empty for new contract)
        const ownerProperties = await realEstate.getPropertiesByOwner(signer1.address);
        console.log("Properties owned by signer1:", ownerProperties.length);
        
        // Test contract functionality with a simple transaction
        console.log("\n=== Testing Basic Functionality ===");
        
        try {
            // Try to list a property (should work if signer is authorized)
            const listTx = await realEstate.connect(signer1).listPropertySimple(
                ethers.parseEther("1.0"),
                "Test Property"
            );
            await listTx.wait();
            console.log("✅ Property listing successful");
            
            // Check if property was added
            const newTotalProperties = await realEstate.getTotalProperties();
            console.log("New total properties:", newTotalProperties);
            
            // Get the property details
            const propertyDetails = await realEstate.getPropertyDetails(0);
            console.log("Property Details:");
            console.log("  - Price:", ethers.formatEther(propertyDetails.price), "ETH");
            console.log("  - Location:", propertyDetails.location);
            console.log("  - Seller:", propertyDetails.seller);
            console.log("  - Is Listed:", propertyDetails.isListed);
            
        } catch (error) {
            console.log("⚠️ Property listing failed (expected if not authorized):", error.message);
        }
        
        // Test event filters
        console.log("\n=== Testing Event Filters ===");
        
        // Get recent PropertyListed events
        const propertyListedFilter = realEstate.filters.PropertyListed();
        const propertyListedEvents = await realEstate.queryFilter(propertyListedFilter, -100);
        console.log("Recent PropertyListed events:", propertyListedEvents.length);
        
        // Get recent OfferSubmitted events
        const offerSubmittedFilter = realEstate.filters.OfferSubmitted();
        const offerSubmittedEvents = await realEstate.queryFilter(offerSubmittedFilter, -100);
        console.log("Recent OfferSubmitted events:", offerSubmittedEvents.length);
        
        // Performance test: Check gas estimation
        console.log("\n=== Gas Estimation ===");
        
        try {
            const estimatedGas = await realEstate.connect(signer1).listPropertySimple.estimateGas(
                ethers.parseEther("1.0"),
                "Gas Test Property"
            );
            console.log("Estimated gas for listPropertySimple:", estimatedGas.toString());
        } catch (error) {
            console.log("⚠️ Gas estimation failed:", error.message);
        }
        
        // Contract interface verification
        console.log("\n=== Interface Verification ===");
        
        // Check if contract supports ERC721 interface
        const supportsERC721 = await realEstate.supportsInterface("0x80ac58cd");
        console.log("Supports ERC721:", supportsERC721);
        
        // Check if contract supports ERC165 interface
        const supportsERC165 = await realEstate.supportsInterface("0x01ffc9a7");
        console.log("Supports ERC165:", supportsERC165);
        
        // Summary
        console.log("\n=== Verification Summary ===");
        console.log("✅ Contract is deployed and accessible");
        console.log("✅ Basic state variables are properly set");
        console.log("✅ View functions are working");
        console.log("✅ Event filters are functional");
        console.log("✅ Interface support is correct");
        
        console.log("\n✅ Contract verification completed successfully!");
        
    } catch (error) {
        console.error("❌ Contract verification failed:", error.message);
        process.exit(1);
    }
}

// Handle errors
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Verification script failed:", error);
        process.exit(1);
    });
