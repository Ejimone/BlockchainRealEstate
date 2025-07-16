# Dynamic Contract & Account Management System

## Overview
This system automatically handles contract addresses and account management for different Ganache instances, eliminating the need for manual configuration.

## Key Features

### 🔄 Dynamic Contract Address Resolution
- **Automatic Detection**: Finds deployed contract addresses from deployment files
- **Network-Aware**: Supports multiple networks (ganache, localhost, hardhat)
- **Deployment Tracking**: Saves detailed deployment information for each network

### 👥 Dynamic Account Management
- **Auto-Discovery**: Automatically detects all available accounts from current network
- **Role Assignment**: Intelligently assigns roles based on available accounts
- **Balance Tracking**: Shows account balances for easy debugging

### 📁 File Structure
```
scripts/
├── utils/
│   └── network-utils.js       # Core dynamic utilities
├── deploy.js                  # Enhanced deployment script
├── interact.js                # Dynamic interaction demo
├── auction-demo.js            # Dynamic auction demonstration
├── verify-contract.js         # Dynamic contract verification
├── analyze-contract.js        # Dynamic contract analysis
└── quick-test.js             # Quick functionality test

deployments/
└── ganache-deployment.json    # Auto-generated deployment info
```

## Core Functions

### `initializeScript(scriptName)`
Main initialization function that:
- Detects network and gets contract address
- Fetches all available accounts with balances
- Assigns roles intelligently
- Returns ready-to-use contract instance and roles

### `getDeployedContractAddress()`
- Searches for deployment files in deployments/ directory
- Supports ganache, localhost, and hardhat networks
- Returns the most recent deployed contract address

### `getNetworkAccounts()`
- Fetches all signers from current network
- Shows account addresses and ETH balances
- Returns array of account objects with signer instances

### `getContractRoles()`
- Assigns roles based on available accounts:
  - Owner/Deployer: Account 0
  - Seller/Agent: Account 1 (or Account 0 if only 1 available)
  - Buyer: Account 0
  - Appraiser: Account 0

## Usage Examples

### Basic Usage
```javascript
const { initializeScript } = require("./utils/network-utils");

async function main() {
    const { contract, roles, networkInfo } = await initializeScript("My Script");
    
    // Use the contract
    const owner = await contract.owner();
    
    // Use the roles
    const tx = await contract.connect(roles.seller.signer).listPropertySimple(
        ethers.parseEther("1.0"),
        "My Property"
    );
}
```

### Individual Functions
```javascript
const { 
    getDeployedContractAddress, 
    getNetworkAccounts, 
    getContractInstance 
} = require("./utils/network-utils");

// Get contract address
const address = await getDeployedContractAddress();

// Get accounts
const accounts = await getNetworkAccounts();

// Get contract instance
const contract = await getContractInstance();
```

## Benefits

### ✅ **No Manual Configuration**
- Contract addresses automatically detected
- Account addresses automatically fetched
- No need to hardcode addresses in scripts

### ✅ **Ganache-Friendly**
- Works with different Ganache instances
- Adapts to changing account addresses
- Handles different account counts gracefully

### ✅ **Network Agnostic**
- Works with ganache, localhost, hardhat networks
- Automatically detects current network
- Saves deployment info per network

### ✅ **Developer Experience**
- Clear console output with emojis
- Detailed account and balance information
- Error handling with helpful messages

### ✅ **Robust & Reliable**
- Fallback mechanisms for missing files
- Handles edge cases (single account, no deployment)
- Comprehensive error messages

## Network Support

| Network | Detection | Deployment Files | Account Management |
|---------|-----------|------------------|-------------------|
| Ganache | ✅ Chain ID 1337 | `ganache-deployment.json` | ✅ Dynamic |
| Localhost | ✅ Default fallback | `localhost-deployment.json` | ✅ Dynamic |
| Hardhat | ✅ Built-in | `hardhat-deployment.json` | ✅ Dynamic |

## Example Output

```
🚀 Initializing Contract Interaction...
==================================================
🌐 Network: ganache (Chain ID: 1337)
📦 Latest block: 25
📍 Found deployed contract at: 0xd5Af159dB28441858Ad1048d80db5489F4137F69
📁 From deployment file: deployments/ganache-deployment.json
✅ Contract instance ready at: 0xd5Af159dB28441858Ad1048d80db5489F4137F69
💰 Found 2 accounts on network:
  Account 0: 0x2582A58a8Fed63466f8A475c6d1bfe71dbC93D28 (97.69 ETH)
  Account 1: 0xBC79F8901232A2bDCcDea8b2108e603CAD8eDa35 (102.24 ETH)
👥 Role assignments:
  Owner/Deployer: 0x2582A58a8Fed63466f8A475c6d1bfe71dbC93D28
  Seller/Agent: 0xBC79F8901232A2bDCcDea8b2108e603CAD8eDa35
  Buyer: 0x2582A58a8Fed63466f8A475c6d1bfe71dbC93D28
  Appraiser: 0x2582A58a8Fed63466f8A475c6d1bfe71dbC93D28
==================================================
✅ Contract Interaction initialized successfully!
```

## Testing

All scripts have been updated and tested:

- ✅ `deploy.js` - Deploys and saves deployment info
- ✅ `verify-contract.js` - Comprehensive contract verification
- ✅ `quick-test.js` - Quick functionality test
- ✅ `analyze-contract.js` - Contract analysis
- ✅ `interact.js` - Full interaction demo
- ✅ `auction-demo.js` - Auction system demo

## Future Enhancements

- [ ] Support for more networks (Sepolia, Mainnet)
- [ ] Multi-contract deployment tracking
- [ ] Advanced role assignment strategies
- [ ] Configuration file for custom role assignments
- [ ] Integration with environment variables
