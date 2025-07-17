'use client';

const OfferCard = ({ offer, onAccept, onReject }) => (
  <div className="p-4 border rounded shadow mt-4">
    <p>Amount: ${offer.amount}</p>
    <p>Buyer: {offer.buyer ? offer.buyer.username : 'Unknown'}</p>
    <p>Expires: {new Date(offer.expires_at).toLocaleString()}</p>
    <button onClick={() => onAccept(offer.id)} className="bg-green-500 text-white p-1 mr-2 rounded">Accept</button>
    <button onClick={() => onReject(offer.id)} className="bg-red-500 text-white p-1 rounded">Reject</button>
  </div>
);

export default OfferCard; 