'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '../../../services/auth';
import { getProperties } from '../../../services/property';
import PropertyCard from '../../../components/PropertyCard';

const BuyerDashboard = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [properties, setProperties] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const u = await getCurrentUser();
        if (u.user_type !== 'buyer' && !u.is_superuser) {
          router.push('/login');
          return;
        }
        setUser(u);
        const props = await getProperties();
        setProperties(props.filter(p => p.is_listed && !p.is_sold));
      } catch (err) {
        router.push('/login');
      }
    };
    fetchData();
  }, [router]);

  const filteredProperties = properties.filter(p => p.location.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Buyer Dashboard</h1>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by location" className="block w-full max-w-lg p-2 border mb-4 rounded" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredProperties.map(p => (
          <PropertyCard key={p.id} property={p} />
        ))}
      </div>
    </div>
  );
};

export default BuyerDashboard; 