'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '../../../services/auth';
import { getProperties, updateInspection } from '../../../services/property';
import PropertyCard from '../../../components/PropertyCard';

const InspectorDashboard = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const u = await getCurrentUser();
        if (u.user_type !== 'inspector' && !u.is_superuser) {
          router.push('/login');
          return;
        }
        setUser(u);
        const props = await getProperties();
        setProperties(props.filter(p => !p.is_inspection_passed && p.is_listed));
      } catch (err) {
        router.push('/login');
      }
    };
    fetchData();
  }, [router]);

  const handlePass = async (id) => {
    await updateInspection(id, true);
    alert('Inspection passed');
    const props = await getProperties();
    setProperties(props.filter(p => !p.is_inspection_passed && p.is_listed));
  };

  const handleFail = async (id) => {
    await updateInspection(id, false);
    alert('Inspection failed');
    const props = await getProperties();
    setProperties(props.filter(p => !p.is_inspection_passed && p.is_listed));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Inspector Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {properties.map(p => (
          <div key={p.id}>
            <PropertyCard property={p} />
            <button onClick={() => handlePass(p.id)} className="bg-green-500 text-white p-1 mr-2 rounded mt-2">Pass</button>
            <button onClick={() => handleFail(p.id)} className="bg-red-500 text-white p-1 rounded mt-2">Fail</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InspectorDashboard; 