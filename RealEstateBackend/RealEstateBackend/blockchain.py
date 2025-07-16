from web3 import Web3
import json
import os

# Configure Web3 to connect to Ganache
GANACHE_URL = os.environ.get('GANACHE_URL')
w3 = Web3(Web3.HTTPProvider(GANACHE_URL))

# Load contract ABI and address
# Make sure RealEstate.json is in the same directory or provide the full path
with open(os.path.join(os.path.dirname(__file__), '../../artifacts/contracts/RealEstate.sol/RealEstate.json'), 'r') as f:
    real_estate_artifact = json.load(f)

REAL_ESTATE_ABI = real_estate_artifact['abi']

with open(os.path.join(os.path.dirname(__file__), '../../deployments/ganache-deployment.json'), 'r') as f:
    ganache_deployment = json.load(f)

REAL_ESTATE_ADDRESS = ganache_deployment['address']

real_estate_contract = w3.eth.contract(address=REAL_ESTATE_ADDRESS, abi=REAL_ESTATE_ABI)

def list_property_on_blockchain(seller_private_key, price, location, property_type, area, bedrooms, bathrooms, agent_address, agent_commission):
    # Convert price to Wei (assuming price is in ETH)
    price_wei = w3.to_wei(price, 'ether')

    # Get the seller's address from the private key
    seller_account = w3.eth.account.from_key(seller_private_key)
    seller_address = seller_account.address

    # Build the transaction
    # Note: The contract's listProperty function expects a string for details, not bytes32
    # Also, propertyType is an enum, so we need to pass its integer representation
    # Assuming PropertyType enum order: RESIDENTIAL=0, COMMERCIAL=1, LAND=2, APARTMENT=3, OFFICE=4
    property_type_map = {
        'RESIDENTIAL': 0,
        'COMMERCIAL': 1,
        'LAND': 2,
        'APARTMENT': 3,
        'OFFICE': 4
    }
    property_type_int = property_type_map.get(property_type, 0) # Default to RESIDENTIAL

    tx = real_estate_contract.functions.listProperty(
        price_wei,
        location, # Using location as details for now
        property_type_int,
        area,
        bedrooms,
        bathrooms,
        agent_address,
        agent_commission
    ).build_transaction({
        'from': seller_address,
        'nonce': w3.eth.get_transaction_count(seller_address),
        'gasPrice': w3.eth.gas_price
    })

    # Sign the transaction
    signed_tx = w3.eth.account.sign_transaction(tx, private_key=seller_private_key)
    print(f"DEBUG: Type of signed_tx (list_property): {type(signed_tx)}")
    print(f"DEBUG: dir(signed_tx) (list_property): {dir(signed_tx)}")

    # Send the transaction
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)

    # Wait for the transaction to be mined
    tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

    return tx_receipt.transactionHash.hex()

def submit_offer_on_blockchain(buyer_private_key, property_id, amount, expires_in_seconds):
    # Convert amount to Wei
    amount_wei = w3.to_wei(amount, 'ether')

    # Get the buyer's address from the private key
    buyer_account = w3.eth.account.from_key(buyer_private_key)
    buyer_address = buyer_account.address

    # Build the transaction
    tx = real_estate_contract.functions.submitOffer(
        property_id,
        expires_in_seconds
    ).build_transaction({
        'from': buyer_address,
        'value': amount_wei, # Attach the offer amount as value
        'nonce': w3.eth.get_transaction_count(buyer_address),
        'gasPrice': w3.eth.gas_price
    })

    # Sign the transaction
    signed_tx = w3.eth.account.sign_transaction(tx, private_key=buyer_private_key)
    print(f"DEBUG: Type of signed_tx (submit_offer): {type(signed_tx)}")
    print(f"DEBUG: dir(signed_tx) (submit_offer): {dir(signed_tx)}")

    # Send the transaction
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)

    # Wait for the transaction to be mined
    tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

    return tx_receipt.transactionHash.hex()

def accept_offer_on_blockchain(seller_private_key, property_id, buyer_address):
    # Get the seller's address from the private key
    seller_account = w3.eth.account.from_key(seller_private_key)
    seller_address = seller_account.address

    # Build the transaction
    tx = real_estate_contract.functions.acceptOffer(
        property_id,
        buyer_address
    ).build_transaction({
        'from': seller_address,
        'nonce': w3.eth.get_transaction_count(seller_address),
        'gasPrice': w3.eth.gas_price
    })

    # Sign the transaction
    signed_tx = w3.eth.account.sign_transaction(tx, private_key=seller_private_key)
    print(f"DEBUG: Type of signed_tx (accept_offer): {type(signed_tx)}")
    print(f"DEBUG: dir(signed_tx) (accept_offer): {dir(signed_tx)}")

    # Send the transaction
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)

    # Wait for the transaction to be mined
    tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

    return tx_receipt.transactionHash.hex()

def update_inspection_status_on_blockchain(appraiser_private_key, property_id, is_passed):
    # Get the appraiser's address from the private key
    appraiser_account = w3.eth.account.from_key(appraiser_private_key)
    appraiser_address = appraiser_account.address

    # Build the transaction
    tx = real_estate_contract.functions.updateInspectionStatus(
        property_id,
        is_passed
    ).build_transaction({
        'from': appraiser_address,
        'nonce': w3.eth.get_transaction_count(appraiser_address),
        'gasPrice': w3.eth.gas_price
    })

    # Sign the transaction
    signed_tx = w3.eth.account.sign_transaction(tx, private_key=appraiser_private_key)
    print(f"DEBUG: Type of signed_tx (update_inspection_status): {type(signed_tx)}")
    print(f"DEBUG: dir(signed_tx) (update_inspection_status): {dir(signed_tx)}")

    # Send the transaction
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)

    # Wait for the transaction to be mined
    tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

    return tx_receipt.transactionHash.hex()

def complete_transaction_on_blockchain(signer_private_key, property_id):
    # Get the signer's address from the private key
    signer_account = w3.eth.account.from_key(signer_private_key)
    signer_address = signer_account.address

    # Build the transaction
    tx = real_estate_contract.functions.completeTransaction(
        property_id
    ).build_transaction({
        'from': signer_address,
        'nonce': w3.eth.get_transaction_count(signer_address),
        'gasPrice': w3.eth.gas_price
    })

    # Sign the transaction
    signed_tx = w3.eth.account.sign_transaction(tx, private_key=signer_private_key)
    print(f"DEBUG: Type of signed_tx (complete_transaction): {type(signed_tx)}")
    print(f"DEBUG: dir(signed_tx) (complete_transaction): {dir(signed_tx)}")

    # Send the transaction
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)

    # Wait for the transaction to be mined
    tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

    return tx_receipt.transactionHash.hex()