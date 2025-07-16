# API Testing Guide

This guide provides instructions on how to manually test the Django backend API, including its blockchain integration.

## Prerequisites

1.  **Ganache:** Ensure your Ganache instance is running. The backend expects it to be accessible at `http://127.0.0.1:8545`.
2.  **Python Environment:** Make sure your Python virtual environment is activated and all dependencies (including `web3.py` and `djangorestframework`) are installed.
3.  **`.env` file:** Create a `.env` file in the root of your `BlockchainRealEstate` directory (the same level as `manage.py`). This file will store sensitive information like private keys.

    **Example `.env` content:**
    ```
    GANACHE_URL=http://127.0.0.1:8545
    SELLER_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
    BUYER_PRIVATE_KEY=0x59c6995e998f97a5a004496c17f0ab241a74142305fd218621064954ee166979
    APPRAISER_PRIVATE_KEY=0x70997970c51812dc3a010c7d01fd1c0aa0fcd34f
    # Add other private keys as needed for different roles
    ```
    **IMPORTANT:** Replace the example private keys with actual private keys from your Ganache accounts. **Never share your private keys or commit them to version control.**

## Testing Steps

Open **three separate terminal windows** for the best experience.

### Terminal 1: Start Django Development Server

Navigate to the `RealEstateBackend` directory:

```bash
cd /Users/evidenceejimone/BlockchainRealEstate/RealEstateBackend
python3 manage.py runserver
```

If port 8000 is already in use, try:

```bash
python3 manage.py runserver 8001
```
(or any other available port).

### Terminal 2: Run Blockchain Event Listener

This command will continuously monitor the blockchain for new events and update your Django database.

Navigate to the `RealEstateBackend` directory:

```bash
cd /Users/evidenceejimone/BlockchainRealEstate/RealEstateBackend
python3 manage.py listen_for_events
```

### Terminal 3: Interact with the API (using `curl` or a tool like Postman/Insomnia)

Use `curl` commands (or your preferred API client) to send requests to the API endpoints. Remember to replace `http://127.0.0.1:8000` with your actual server address if you used a different port.

#### 1. Create Users (Seller, Buyer, Appraiser, Inspector)

You need to create users with `user_type` and an `eth_address` that corresponds to a private key in your `.env` file.

**Create a Seller:**
```bash
curl -X POST http://127.0.0.1:8000/api/users/ \
-H "Content-Type: application/json" \
-d '{
    "username": "test_seller",
    "password": "password123",
    "email": "seller@example.com",
    "user_type": "seller",
    "userprofile": {
        "address": "123 Seller St",
        "phone_number": "123-456-7890",
        "eth_address": "0x04e89C61356a986DB4bb4b4c797535E285b6404C"
    }
}'
```

**Create a Buyer:**
```bash
curl -X POST http://127.0.0.1:8000/api/users/ \
-H "Content-Type: application/json" \
-d '{
    "username": "test_buyer",
    "password": "password123",
    "email": "buyer@example.com",
    "user_type": "buyer",
    "userprofile": {
        "address": "456 Buyer Ave",
        "phone_number": "987-654-3210",
        "eth_address": "0xBC79F8901232A2bDCcDea8b2108e603CAD8eDa35"
    }
}'
```

**Create an Appraiser:**
```bash
curl -X POST http://127.0.0.1:8000/api/users/ \
-H "Content-Type: application/json" \
-d '{
    "username": "test_appraiser",
    "password": "password123",
    "email": "appraiser@example.com",
    "user_type": "appraiser",
    "userprofile": {
        "address": "789 Appraiser Rd",
        "phone_number": "555-111-2222",
        "eth_address": "0x70997970c51812dc3a010c7d01fd1c0aa0fcd34f"
    }
}'
```

#### 2. Get Authentication Tokens

You'll need tokens for the seller and buyer to perform authenticated actions.

**Get Seller's Token:**
```bash
curl -X POST http://127.0.0.1:8000/api-token-auth/ \
-H "Content-Type: application/json" \
-d '{"username": "test_seller", "password": "password123"}'
```
Copy the `token` value from the response. This is `SELLER_AUTH_TOKEN`.

**Get Buyer's Token:**
```bash
curl -X POST http://127.0.0.1:8000/api-token-auth/ \
-H "Content-Type: application/json" \
-d '{"username": "test_buyer", "password": "password123"}'
```
Copy the `token` value from the response. This is `BUYER_AUTH_TOKEN`.

#### 3. Create a Property (as Seller)

Use the `SELLER_AUTH_TOKEN`. This action will trigger a blockchain transaction.

```bash
curl -X POST http://127.0.0.1:8000/api/properties/ \
-H "Content-Type: application/json" \
-H "Authorization:870fc76482cbe4e906fc2d48a53ca470a5d52d71" \
-d '{
    "price": 100.00,
    "location": "123 Blockchain Ave",
    "description": "A lovely blockchain-backed property",
    "property_type": "RESIDENTIAL",
    "area": 150,
    "bedrooms": 3,
    "bathrooms": 2,
    "agent_commission": 250
}'
```
Note the `id` of the created property from the response. (e.g., `property_id = 1`)

#### 4. Make an Offer (as Buyer)

Use the `BUYER_AUTH_TOKEN`. This action will trigger a blockchain transaction.

```bash
curl -X POST http://127.0.0.1:8000/api/offers/ \
-H "Content-Type: application/json" \
-H "Authorization: Token BUYER_AUTH_TOKEN" \
-d '{
    "property": 1,  // Use the property_id from step 3
    "amount": 95.00,
    "expires_at": "2025-12-31T23:59:59Z"
}'
```
Note the `id` of the created offer from the response. (e.g., `offer_id = 1`)

#### 5. Update Inspection Status (as Appraiser)

Use the `APPRAISER_AUTH_TOKEN` (get it similarly to seller/buyer tokens). This action will trigger a blockchain transaction.

```bash
curl -X PATCH http://127.0.0.1:8000/api/properties/1/update_inspection_status/ \
-H "Content-Type: application/json" \
-H "Authorization: Token APPRAISER_AUTH_TOKEN" \
-d '{"is_inspection_passed": true}'
```
(Replace `1` with the `property_id` from step 3.)

#### 6. Accept an Offer (as Seller)

Use the `SELLER_AUTH_TOKEN`. This action will trigger a blockchain transaction.

```bash
curl -X POST http://127.0.0.1:8000/api/offers/1/accept/ \
-H "Authorization: Token SELLER_AUTH_TOKEN"
```
(Replace `1` with the `offer_id` from step 4.)

#### 7. Complete Transaction (as Seller or Buyer)

This action will trigger a blockchain transaction.

```bash
curl -X POST http://127.0.0.1:8000/api/properties/1/complete_transaction/ \
-H "Authorization: Token SELLER_AUTH_TOKEN" # Or BUYER_AUTH_TOKEN
```
(Replace `1` with the `property_id` from step 3.)

---

**Monitoring:**

*   Observe the output in **Terminal 2 (Blockchain Event Listener)**. You should see messages indicating that events are being processed and the Django database is being updated.
*   Check your Ganache UI to see the new transactions and updated account balances.
*   You can also check the Django admin panel (`http://127.0.0.1:8000/admin/`) to see if the `Property`, `Offer`, and `Transaction` objects are being created and updated correctly.
