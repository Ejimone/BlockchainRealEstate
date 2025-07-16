const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Dynamically get the deployed contract address for the current network
 */
async function getDeployedContractAddress() {
    const network = await ethers.provider.getNetwork();
    const networkName = network.name === "unknown" ? "ganache" : network.name;
    
    // Try to find deployment record
    const deploymentFiles = [
        `deployments/${networkName}-deployment.json`,
        `deployments/localhost-deployment.json`,
        `deployments/hardhat-deployment.json`
    ];
    
    for (const file of deploymentFiles) {
        const deploymentPath = path.join(process.cwd(), file);
        if (fs.existsSync(deploymentPath)) {
            try {
                const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
                if (deployment.address) {
                    console.log(`📍 Found deployed contract at: ${deployment.address}`);
                    console.log(`📁 From deployment file: ${file}`);
                    return deployment.address;
                }
            } catch (error) {
                console.warn(`⚠️ Could not read deployment file: ${file}`);
            }
        }
    }
    
    throw new Error(`❌ No deployment found for network: ${networkName}. Please deploy the contract first.`);
}

/**
 * Get all available accounts from the current network
 */
async function getNetworkAccounts() {
    const signers = await ethers.getSigners();
    const accounts = [];
    
    for (let i = 0; i < signers.length; i++) {
        const signer = signers[i];
        const balance = await ethers.provider.getBalance(signer.address);
        accounts.push({
            index: i,
            address: signer.address,
            balance: ethers.formatEther(balance),
            signer: signer
        });
    }
    
    console.log(`💰 Found ${accounts.length} accounts on network:`);
    accounts.forEach((acc, i) => {
        console.log(`  Account ${i}: ${acc.address} (${parseFloat(acc.balance).toFixed(2)} ETH)`);
    });
    
    return accounts;
}

/**
 * Get specific roles for the contract based on available accounts
 */
async function getContractRoles() {
    const accounts = await getNetworkAccounts();
    
    if (accounts.length < 2) {
        console.warn("⚠️ Only 1 account available. Using same account for multiple roles.");
        return {
            owner: accounts[0],
            seller: accounts[0],
            buyer: accounts[0],
            appraiser: accounts[0],
            allAccounts: accounts
        };
    }
    
    // Assign roles based on available accounts
    const roles = {
        owner: accounts[0],      // First account as owner/deployer
        seller: accounts[1],     // Second account as seller/agent
        buyer: accounts[0],      // First account as buyer (different from seller)
        appraiser: accounts[0],  // First account as appraiser
        allAccounts: accounts
    };
    
    console.log("👥 Role assignments:");
    console.log(`  Owner/Deployer: ${roles.owner.address}`);
    console.log(`  Seller/Agent: ${roles.seller.address}`);
    console.log(`  Buyer: ${roles.buyer.address}`);
    console.log(`  Appraiser: ${roles.appraiser.address}`);
    
    return roles;
}

/**
 * Get contract instance with deployed address
 */
async function getContractInstance() {
    const contractAddress = await getDeployedContractAddress();
    const RealEstate = await ethers.getContractFactory("RealEstate");
    const contract = RealEstate.attach(contractAddress);
    
    // Verify contract is deployed
    const code = await ethers.provider.getCode(contractAddress);
    if (code === "0x") {
        throw new Error(`❌ No contract code found at address: ${contractAddress}`);
    }
    
    console.log(`✅ Contract instance ready at: ${contractAddress}`);
    return contract;
}

/**
 * Get network information
 */
async function getNetworkInfo() {
    const network = await ethers.provider.getNetwork();
    const blockNumber = await ethers.provider.getBlockNumber();
    
    const info = {
        name: network.name === "unknown" ? "ganache" : network.name,
        chainId: network.chainId,
        blockNumber: blockNumber
    };
    
    console.log(`🌐 Network: ${info.name} (Chain ID: ${info.chainId})`);
    console.log(`📦 Latest block: ${info.blockNumber}`);
    
    return info;
}

/**
 * Initialize script with all necessary components
 */
async function initializeScript(scriptName) {
    console.log(`🚀 Initializing ${scriptName}...`);
    console.log("=" .repeat(50));
    
    const networkInfo = await getNetworkInfo();
    const contract = await getContractInstance();
    const roles = await getContractRoles();
    
    console.log("=" .repeat(50));
    console.log(`✅ ${scriptName} initialized successfully!`);
    console.log("");
    
    return {
        contract,
        roles,
        networkInfo
    };
}

module.exports = {
    getDeployedContractAddress,
    getNetworkAccounts,
    getContractRoles,
    getContractInstance,
    getNetworkInfo,
    initializeScript
};
