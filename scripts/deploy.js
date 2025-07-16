const { ethers } = require("hardhat");

async function main() {
    console.log("Starting RealEstate contract deployment...");
    
    // Get the contract factory
    const RealEstate = await ethers.getContractFactory("RealEstate");
    
    // Deploy the contract
    console.log("Deploying contract...");
    const realEstate = await RealEstate.deploy();
    
    // Wait for deployment to complete
    await realEstate.waitForDeployment();
    
    const contractAddress = await realEstate.getAddress();
    console.log("RealEstate contract deployed to:", contractAddress);
    
    // Get deployment details
    const [deployer] = await ethers.getSigners();
    const network = await ethers.provider.getNetwork();
    const balance = await ethers.provider.getBalance(deployer.address);
    
    console.log("\n=== Deployment Details ===");
    console.log("Network:", network.name);
    console.log("Chain ID:", network.chainId.toString());
    console.log("Deployer:", deployer.address);
    console.log("Deployer Balance:", ethers.formatEther(balance), "ETH");
    console.log("Contract Address:", contractAddress);
    
    // Verify initial contract state
    console.log("\n=== Initial Contract State ===");
    const owner = await realEstate.owner();
    const platformFee = await realEstate.platformFee();
    const totalProperties = await realEstate.getTotalProperties();
    
    console.log("Owner:", owner);
    console.log("Platform Fee:", platformFee.toString(), "basis points (", Number(platformFee) / 100, "%)");
    console.log("Total Properties:", totalProperties.toString());
    
    // Save deployment info
    const deploymentInfo = {
        network: network.name,
        chainId: network.chainId.toString(),
        contractAddress: contractAddress,
        deployer: deployer.address,
        deploymentTime: new Date().toISOString(),
        platformFee: platformFee.toString(),
        owner: owner
    };
    
    const fs = require('fs');
    const path = require('path');
    
    // Create deployments directory if it doesn't exist
    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir);
    }
    
    // Save deployment info
    const deploymentFile = path.join(deploymentsDir, `${network.name}-deployment.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log("Deployment info saved to:", deploymentFile);
    
    console.log("\n✅ Deployment completed successfully!");
    console.log("\nNext steps:");
    console.log("1. Set appraiser: realEstate.setAppraiser(appraiserAddress)");
    console.log("2. Authorize agents: realEstate.setAgentAuthorization(agentAddress, true)");
    console.log("3. Verify contract on block explorer (if on testnet/mainnet)");
}

// Handle errors
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Deployment failed:", error);
        process.exit(1);
    });
