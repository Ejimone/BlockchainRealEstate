# RealEstate Smart Contract Scripts

This directory contains utility scripts for deploying, testing, and interacting with the RealEstate smart contract.

## Scripts Overview

### 1. `deploy.js` - Contract Deployment
**Purpose**: Deploy the RealEstate contract to any network (local, testnet, mainnet)

**Features**:
- Deploys contract with proper initialization
- Saves deployment information to `deployments/` directory
- Verifies initial contract state
- Provides deployment summary

**Usage**:
```bash
# Deploy to local network
npx hardhat run scripts/deploy.js

# Deploy to specific network
npx hardhat run scripts/deploy.js --network goerli
npx hardhat run scripts/deploy.js --network mainnet
```

**Output**: Creates deployment file in `deployments/{network}-deployment.json`

### 2. `interact.js` - Basic Contract Interaction
**Purpose**: Demonstrate basic contract functionality with a complete transaction flow

**Features**:
- Sets up appraiser and agent roles
- Lists a property
- Submits and accepts an offer
- Verifies NFT ownership transfer
- Shows complete transaction lifecycle

**Usage**:
```bash
# Use default contract address
npx hardhat run scripts/interact.js

# Use specific contract address
CONTRACT_ADDRESS=0x123... npx hardhat run scripts/interact.js
```

### 3. `auction-demo.js` - Auction System Demo
**Purpose**: Demonstrate the auction functionality with multiple bidders

**Features**:
- Sets up auction environment
- Creates and starts an auction
- Simulates multiple bidders
- Handles auction completion
- Shows winner selection and NFT transfer

**Usage**:
```bash
npx hardhat run scripts/auction-demo.js
```

**Demo Flow**:
1. Lists property for auction
2. Starts auction with minimum bid
3. Multiple bidders place competing bids
4. Simulates time passage
5. Ends auction and transfers NFT to winner

### 4. `verify-contract.js` - Contract Verification
**Purpose**: Verify contract deployment and basic functionality

**Features**:
- Confirms contract deployment
- Checks contract state variables
- Tests view functions
- Verifies event emission
- Tests interface support
- Estimates gas costs

**Usage**:
```bash
npx hardhat run scripts/verify-contract.js
```

### 5. `analyze-contract.js` - Contract Analysis
**Purpose**: Comprehensive analysis of deployed contract

**Features**:
- Network and block information
- Contract state analysis
- Property portfolio analysis
- Event history analysis
- Transaction volume analysis
- Active auction monitoring
- Gas usage analysis
- Contract size analysis
- Security checklist

**Usage**:
```bash
npx hardhat run scripts/analyze-contract.js
```

### 6. `setup-dev.js` - Development Environment Setup
**Purpose**: Set up a complete development environment with sample data

**Features**:
- Creates multiple user roles
- Lists various property types
- Creates sample offers
- Sets up active auctions
- Completes sample transactions
- Provides comprehensive test data

**Usage**:
```bash
npx hardhat run scripts/setup-dev.js
```

**Creates**:
- 4 sample properties (residential, commercial, simple, auction)
- Multiple user roles (owner, appraiser, agents, sellers, buyers)
- Active offers and auctions
- Completed transactions
- Property documents and inspections

## Environment Variables

Set these environment variables for enhanced functionality:

```bash
export CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
export PRIVATE_KEY=your_private_key_here
export INFURA_PROJECT_ID=your_infura_project_id
export ETHERSCAN_API_KEY=your_etherscan_api_key
```

## Network Configuration

### Local Development (Hardhat Network)
```bash
npx hardhat node
# In another terminal:
npx hardhat run scripts/deploy.js --network localhost
```

### Testnet Deployment (Goerli)
```bash
npx hardhat run scripts/deploy.js --network goerli
```

### Mainnet Deployment
```bash
npx hardhat run scripts/deploy.js --network mainnet
```

## Common Workflows

### 1. Fresh Development Setup
```bash
# Start local node
npx hardhat node

# Deploy contract
npx hardhat run scripts/deploy.js --network localhost

# Set up development environment
npx hardhat run scripts/setup-dev.js --network localhost

# Verify everything works
npx hardhat run scripts/verify-contract.js --network localhost
```

### 2. Testing Auction System
```bash
# Deploy contract
npx hardhat run scripts/deploy.js

# Run auction demo
npx hardhat run scripts/auction-demo.js
```

### 3. Production Deployment
```bash
# Deploy to mainnet
npx hardhat run scripts/deploy.js --network mainnet

# Verify deployment
npx hardhat run scripts/verify-contract.js --network mainnet

# Analyze contract
npx hardhat run scripts/analyze-contract.js --network mainnet
```

### 4. Contract Analysis
```bash
# Get comprehensive analysis
npx hardhat run scripts/analyze-contract.js

# Basic verification
npx hardhat run scripts/verify-contract.js
```

## Script Output

All scripts provide detailed console output including:
- ✅ Success indicators
- ❌ Error indicators
- ⚠️ Warning indicators
- Transaction hashes
- Gas usage information
- Contract addresses
- Event logs

## Error Handling

Scripts include comprehensive error handling:
- Network connection issues
- Contract deployment failures
- Transaction failures
- Gas estimation errors
- Permission errors

## Gas Optimization

Scripts include gas optimization features:
- Gas estimation for all operations
- Transaction batching where applicable
- Efficient contract interaction patterns
- Gas usage reporting

## Security Considerations

Scripts implement security best practices:
- Input validation
- Access control verification
- Reentrancy protection testing
- Pause functionality testing
- Error condition handling

## Customization

### Adding New Scripts
1. Create new script in `scripts/` directory
2. Follow existing patterns for error handling
3. Include comprehensive logging
4. Add documentation to this README

### Modifying Existing Scripts
1. Update script functionality
2. Test with local network first
3. Update documentation
4. Ensure backward compatibility

## Troubleshooting

### Common Issues

**Contract Not Found**:
```bash
Error: Contract not found at address
```
Solution: Update CONTRACT_ADDRESS environment variable

**Insufficient Gas**:
```bash
Error: Transaction ran out of gas
```
Solution: Increase gas limit in hardhat.config.js

**Network Connection**:
```bash
Error: Could not connect to network
```
Solution: Check network configuration and RPC endpoints

**Permission Denied**:
```bash
Error: Not authorized to perform action
```
Solution: Ensure proper role setup and permissions

### Debug Mode

Add debug logging to any script:
```javascript
const DEBUG = process.env.DEBUG === 'true';
if (DEBUG) console.log('Debug info:', data);
```

Run with debug mode:
```bash
DEBUG=true npx hardhat run scripts/script-name.js
```

## Integration with Frontend

These scripts can be adapted for frontend integration:
- Use same contract interaction patterns
- Adapt for browser environment
- Handle user wallet connections
- Implement proper error handling

## Testing Scripts

Test scripts functionality:
```bash
# Run all tests
npx hardhat test

# Test specific script functionality
npx hardhat run scripts/verify-contract.js
```

---

For more information, see the main project [README.md](../README.md) and [TESTING.md](../TESTING.md) documentation.
