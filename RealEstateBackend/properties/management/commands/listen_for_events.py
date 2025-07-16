
from django.core.management.base import BaseCommand
from web3 import Web3
import json
import os
from properties.models import Property, Offer
from users.models import CustomUser

# Configure Web3 to connect to Ganache
GANACHE_URL = os.environ.get('GANACHE_URL', 'http://127.0.0.1:8545')
w3 = Web3(Web3.HTTPProvider(GANACHE_URL))

# Load contract ABI and address
with open(os.path.join(os.path.dirname(__file__), '../../../artifacts/contracts/RealEstate.sol/RealEstate.json'), 'r') as f:
    real_estate_artifact = json.load(f)

REAL_ESTATE_ABI = real_estate_artifact['abi']

with open(os.path.join(os.path.dirname(__file__), '../../../deployments/ganache-deployment.json'), 'r') as f:
    ganache_deployment = json.load(f)

REAL_ESTATE_ADDRESS = ganache_deployment['address']

real_estate_contract = w3.eth.contract(address=REAL_ESTATE_ADDRESS, abi=REAL_ESTATE_ABI)

LAST_PROCESSED_BLOCK_FILE = os.path.join(os.path.dirname(__file__), 'last_processed_block.txt')

def get_last_processed_block():
    if os.path.exists(LAST_PROCESSED_BLOCK_FILE):
        with open(LAST_PROCESSED_BLOCK_FILE, 'r') as f:
            return int(f.read().strip())
    return 0 # Start from block 0 if no file exists

def set_last_processed_block(block_number):
    with open(LAST_PROCESSED_BLOCK_FILE, 'w') as f:
        f.write(str(block_number))

class Command(BaseCommand):
    help = 'Listens for and processes blockchain events from the RealEstate contract.'

    def handle(self, *args, **options):
        self.stdout.write("Starting blockchain event listener...")
        last_block = get_last_processed_block()
        self.stdout.write(f"Last processed block: {last_block}")

        try:
            current_block = w3.eth.block_number
            if current_block <= last_block:
                self.stdout.write("No new blocks to process.")
                return

            self.stdout.write(f"Processing blocks from {last_block + 1} to {current_block}")

            # Process PropertyListed events
            property_listed_filter = real_estate_contract.events.PropertyListed.create_filter(fromBlock=last_block + 1, toBlock=current_block)
            for event in property_listed_filter.get_all_entries():
                self.process_property_listed_event(event)

            # Process OfferAccepted events
            offer_accepted_filter = real_estate_contract.events.OfferAccepted.create_filter(fromBlock=last_block + 1, toBlock=current_block)
            for event in offer_accepted_filter.get_all_entries():
                self.process_offer_accepted_event(event)

            # Process PropertySold events (if distinct from OfferAccepted leading to sale)
            property_sold_filter = real_estate_contract.events.PropertySold.create_filter(fromBlock=last_block + 1, toBlock=current_block)
            for event in property_sold_filter.get_all_entries():
                self.process_property_sold_event(event)

            set_last_processed_block(current_block)
            self.stdout.write(f"Successfully processed up to block {current_block}")

        except Exception as e:
            self.stderr.write(f"Error processing blockchain events: {e}")

    def process_property_listed_event(self, event):
        property_id = event.args.propertyId
        seller_address = event.args.seller
        price = w3.from_wei(event.args.price, 'ether')
        location = event.args.details

        seller_user = CustomUser.objects.filter(userprofile__eth_address=seller_address).first()
        if not seller_user:
            self.stdout.write(f"Seller {seller_address} not found in Django DB. Skipping property listing.")
            return

        # Check if property already exists to avoid duplicates
        if not Property.objects.filter(id=property_id).exists():
            Property.objects.create(
                id=property_id,
                seller=seller_user,
                price=price,
                location=location,
                description=location, # Using location as description for now
                is_listed=True,
                transaction_hash=event.transactionHash.hex()
            )
            self.stdout.write(f"Property {property_id} listed by {seller_address} on blockchain. Added to Django DB.")
        else:
            self.stdout.write(f"Property {property_id} already exists in Django DB. Updating.")
            Property.objects.filter(id=property_id).update(
                seller=seller_user,
                price=price,
                location=location,
                description=location, # Using location as description for now
                is_listed=True,
                transaction_hash=event.transactionHash.hex()
            )

    def process_offer_accepted_event(self, event):
        property_id = event.args.propertyId
        buyer_address = event.args.buyer
        offer_amount = w3.from_wei(event.args.offerAmount, 'ether')

        property_obj = Property.objects.filter(id=property_id).first()
        buyer_user = CustomUser.objects.filter(userprofile__eth_address=buyer_address).first()

        if not property_obj:
            self.stdout.write(f"Property {property_id} not found in Django DB. Skipping offer acceptance.")
            return
        if not buyer_user:
            self.stdout.write(f"Buyer {buyer_address} not found in Django DB. Skipping offer acceptance.")
            return

        # Find the offer and update it
        offer_obj = Offer.objects.filter(property=property_obj, buyer=buyer_user, amount=offer_amount, is_active=True).first()
        if offer_obj:
            offer_obj.is_active = False
            offer_obj.save()
            self.stdout.write(f"Offer for property {property_id} by {buyer_address} accepted on blockchain. Updated in Django DB.")
        else:
            self.stdout.write(f"No active offer found for property {property_id} by {buyer_address} with amount {offer_amount}. Creating new offer record.")
            # If offer not found, create a new one (this might happen if offer was made directly on blockchain)
            Offer.objects.create(
                property=property_obj,
                buyer=buyer_user,
                amount=offer_amount,
                is_active=False, # Mark as inactive since it's accepted
                expires_at=w3.eth.get_block(event.blockNumber).timestamp, # Use block timestamp as a placeholder
                transaction_hash=event.transactionHash.hex()
            )

        # Update property status
        property_obj.is_sold = True
        property_obj.buyer = buyer_user
        property_obj.offer_amount = offer_amount
        property_obj.save()
        self.stdout.write(f"Property {property_id} marked as sold to {buyer_address} in Django DB.")

    def process_property_sold_event(self, event):
        property_id = event.args.propertyId
        buyer_address = event.args.buyer
        sale_price = w3.from_wei(event.args.salePrice, 'ether')

        property_obj = Property.objects.filter(id=property_id).first()
        buyer_user = CustomUser.objects.filter(userprofile__eth_address=buyer_address).first()

        if not property_obj:
            self.stdout.write(f"Property {property_id} not found in Django DB. Skipping property sold event.")
            return
        if not buyer_user:
            self.stdout.write(f"Buyer {buyer_address} not found in Django DB. Skipping property sold event.")
            return

        # Update property status if not already updated by OfferAccepted
        if not property_obj.is_sold:
            property_obj.is_sold = True
            property_obj.buyer = buyer_user
            property_obj.offer_amount = sale_price
            property_obj.save()
            self.stdout.write(f"Property {property_id} marked as sold to {buyer_address} in Django DB (from PropertySold event).")

        # Create or update Transaction record
        transaction_obj, created = Transaction.objects.update_or_create(
            property=property_obj,
            defaults={
                'seller': property_obj.seller,
                'buyer': buyer_user,
                'price': sale_price,
                'transaction_hash': event.transactionHash.hex()
            }
        )
        if created:
            self.stdout.write(f"Transaction record created for property {property_id}.")
        else:
            self.stdout.write(f"Transaction record updated for property {property_id}.")
