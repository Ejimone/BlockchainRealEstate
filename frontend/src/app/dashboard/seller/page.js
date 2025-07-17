'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '../../../services/auth';
import { getProperties, createProperty, getOffers, acceptOffer, rejectOffer } from '../../../services/property';
import PropertyCard from '../../../components/PropertyCard';
import OfferCard from '../../../components/OfferCard';

const SellerDashboard = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [properties, setProperties] = useState([]);
  const [offers, setOffers] = useState([]);
  const [newProperty, setNewProperty] = useState({ price: '', location: '', description: '', property_type: 'RESIDENTIAL', area: 0, bedrooms: 0, bathrooms: 0, agent_commission: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const u = await getCurrentUser();
        if (u.user_type !== 'seller' && !u.is_superuser) {
          router.push('/login');
          return;
        }
        setUser(u);
        const props = await getProperties();
        setProperties(props.filter(p => p.seller.id === u.id));
        const offs = await getOffers();
        setOffers(offs);
      } catch (err) {
        router.push('/login');
      }
    };
    fetchData();
  }, [router]);

  const handleChange = (e) => setNewProperty({ ...newProperty, [e.target.name]: e.target.value });

  const handleCreate = async (e) => {
    e.preventDefault();
    await createProperty(newProperty);
    alert('Property listed');
    // refresh
    const props = await getProperties();
    setProperties(props.filter(p => p.seller.id === user.id));
  };

  const handleAccept = async (id) => {
    await acceptOffer(id);
    alert('Offer accepted');
    // refresh
    const offs = await getOffers();
    setOffers(offs);
  };

  const handleReject = async (id) => {
    await rejectOffer(id);
    alert('Offer rejected');
    // refresh
    const offs = await getOffers();
    setOffers(offs);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Seller Dashboard</h1>
      <h2 className="text-xl mb-2">List New Property</h2>
      <form onSubmit={handleCreate} className="space-y-4 mb-8">
        <input name="price" value={newProperty.price} onChange={handleChange} placeholder="Price" className="block p-2 border rounded" />
        <input name="location" value={newProperty.location} onChange={handleChange} placeholder="Location" className="block p-2 border rounded" />
        <textarea name="description" value={newProperty.description} onChange={handleChange} placeholder="Description" className="block p-2 border rounded" />
        <select name="property_type" value={newProperty.property_type} onChange={handleChange} className="block p-2 border rounded">
          <option value="RESIDENTIAL">Residential</option>
          <option value="COMMERCIAL">Commercial</option>
          <option value="LAND">Land</option>
          <option value="APARTMENT">Apartment</option>
          <option value="OFFICE">Office</option>
        </select>
        <input name="area" type="number" value={newProperty.area} onChange={handleChange} placeholder="Area" className="block p-2 border rounded" />
        <input name="bedrooms" type="number" value={newProperty.bedrooms} onChange={handleChange} placeholder="Bedrooms" className="block p-2 border rounded" />
        <input name="bathrooms" type="number" value={newProperty.bathrooms} onChange={handleChange} placeholder="Bathrooms" className="block p-2 border rounded" />
        <input name="agent_commission" type="number" value={newProperty.agent_commission} onChange={handleChange} placeholder="Agent Commission" className="block p-2 border rounded" />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">List Property</button>
      </form>
      <h2 className="text-xl mb-2">My Properties</h2>
      {properties.map(p => (
        <div key={p.id}>
          <PropertyCard property={p} showLink={false} />
          <h3 className="text-lg mt-2">Offers</h3>
          {offers.filter(o => o.property === p.id && o.is_active).map(o => (
            <OfferCard key={o.id} offer={o} onAccept={handleAccept} onReject={handleReject} />
          ))}
        </div>
      ))}
    </div>
  );
};

export default SellerDashboard; 