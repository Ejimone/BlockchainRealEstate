'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getProperty, submitOffer, completeTransaction } from '../../../../services/property';
import { getCurrentUser } from '../../../../services/auth';

const PropertyDetails = () => {
  const { id } = useParams();
  const router = useRouter();
  const [property, setProperty] = useState(null);
  const [user, setUser] = useState(null);
  const [offer, setOffer] = useState({ amount: '', expires_at: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const u = await getCurrentUser();
        setUser(u);
        const p = await getProperty(id);
        setProperty(p);
      } catch (err) {
        router.push('/login');
      }
    };
    fetchData();
  }, [id, router]);

  const handleOfferChange = (e) => setOffer({ ...offer, [e.target.name]: e.target.value });

  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    await submitOffer({ ...offer, property: id });
    alert('Offer submitted');
  };

  const handleComplete = async () => {
    await completeTransaction(id);
    alert('Transaction completed');
    router.push('/dashboard');
  };

  if (!property) return <div className="p-6">Loading...</div>;

  const canComplete = user && (user.id === property.seller.id || (property.buyer && user.id === property.buyer.id)) && property.is_inspection_passed && property.financing_approved; // assume is_appraisal_passed if added

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{property.location}</h1>
      <p>Price: ${property.price}</p>
      <p>Type: {property.property_type}</p>
      <p>Description: {property.description}</p>
      <p>Area: {property.area} sq ft</p>
      <p>Bedrooms: {property.bedrooms}</p>
      <p>Bathrooms: {property.bathrooms}</p>
      <p>Listed: {property.is_listed ? 'Yes' : 'No'}</p>
      <p>Sold: {property.is_sold ? 'Yes' : 'No'}</p>
      <p>Inspection Passed: {property.is_inspection_passed ? 'Yes' : 'No'}</p>
      <p>Financing Approved: {property.financing_approved ? 'Yes' : 'No'}</p>
      {user && user.user_type === 'buyer' && !property.is_sold && (
        <form onSubmit={handleSubmitOffer} className="space-y-4 mt-6">
          <input name="amount" value={offer.amount} onChange={handleOfferChange} placeholder="Offer Amount" className="block p-2 border rounded" type="number" />
          <input name="expires_at" value={offer.expires_at} onChange={handleOfferChange} className="block p-2 border rounded" type="datetime-local" />
          <button type="submit" className="bg-blue-500 text-white p-2 rounded">Submit Offer</button>
        </form>
      )}
      {canComplete && <button onClick={handleComplete} className="bg-green-500 text-white p-2 mt-4 rounded">Complete Transaction</button>}
    </div>
  );
};

export default PropertyDetails; 