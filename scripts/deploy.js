const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("Starting RealEstate contract deployment...");
    
    // Get network information
    const network = await ethers.provider.getNetwork();
    console.log("Network:", network.name === "unknown" ? "localhost" : network.name);
    console.log("Chain ID:", network.chainId);
    
    // Get deployer
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    
    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Deployer Balance:", ethers.formatEther(balance), "ETH");
    
    // Deploy the contract
    console.log("\nDeploying contract...");
    const RealEstate = await ethers.getContractFactory("RealEstate");
    const realEstate = await RealEstate.deploy(); // No constructor arguments
    
    // Wait for deployment to complete
    await realEstate.waitForDeployment();
    
    // Get deployment transaction
    const deploymentTx = await realEstate.deploymentTransaction();
    const receipt = await deploymentTx.wait();
    
    console.log("RealEstate contract deployed to:", realEstate.target);
    
    // Display deployment details
    console.log("\n=== Deployment Details ===");
    console.log("Network:", network.name === "unknown" ? "localhost" : network.name);
    console.log("Chain ID:", network.chainId);
    console.log("Deployer:", deployer.address);
    console.log("Deployer Balance:", ethers.formatEther(balance), "ETH");
    console.log("Contract Address:", realEstate.target);
    console.log("Transaction Hash:", deploymentTx.hash);
    console.log("Block Number:", receipt.blockNumber);
    console.log("Gas Used:", receipt.gasUsed.toString());
    
    // Display initial contract state
    console.log("\n=== Initial Contract State ===");
    const owner = await realEstate.owner();
    const platformFee = await realEstate.platformFee();
    const totalProperties = await realEstate.getTotalProperties();
    
    console.log("Owner:", owner);
    console.log("Platform Fee:", platformFee.toString(), "basis points (", (Number(platformFee) / 100).toString(), "%)");
    console.log("Total Properties:", totalProperties.toString());
    
    // Save deployment info
    const currentNetwork = await ethers.provider.getNetwork();
    let networkName = currentNetwork.name === "unknown" ? "localhost" : currentNetwork.name;
    
    // Special handling for Ganache
    if (currentNetwork.chainId === 1337n) {
        networkName = "ganache";
    }
    
    const deploymentInfo = {
        contractName: "RealEstate",
        address: realEstate.target,
        deployer: deployer.address,
        network: networkName,
        chainId: currentNetwork.chainId.toString(),
        blockNumber: receipt.blockNumber,
        transactionHash: deploymentTx.hash,
        timestamp: new Date().toISOString(),
        constructorArgs: {
            initialOwner: deployer.address,
            initialAppraiser: deployer.address
        },
        gasUsed: receipt.gasUsed.toString(),
        gasPrice: deploymentTx.gasPrice.toString()
    };
    
    // Ensure deployments directory exists
    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    const deploymentPath = path.join(deploymentsDir, `${networkName}-deployment.json`);
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    
    console.log(`\n📁 Deployment info saved to: ${deploymentPath}`);
    console.log("\n✅ Deployment completed successfully!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
