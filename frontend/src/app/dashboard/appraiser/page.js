'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '../../../services/auth';
import { getProperties, updateAppraisal } from '../../../services/property';
import PropertyCard from '../../../components/PropertyCard';

const AppraiserDashboard = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [properties, setProperties] = useState([]);
  const [appraisals, setAppraisals] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const u = await getCurrentUser();
        if (u.user_type !== 'appraiser' && !u.is_superuser) {
          router.push('/login');
          return;
        }
        setUser(u);
        const props = await getProperties();
        setProperties(props.filter(p => p.is_listed)); // assume all listed need appraisal
      } catch (err) {
        router.push('/login');
      }
    };
    fetchData();
  }, [router]);

  const handleValueChange = (id, value) => setAppraisals({ ...appraisals, [id]: value });

  const handleSubmit = async (id) => {
    const value = appraisals[id] || 0;
    await updateAppraisal(id, value);
    alert('Appraisal submitted');
    // perhaps remove from list if done
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Appraiser Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {properties.map(p => (
          <div key={p.id}>
            <PropertyCard property={p} />
            <input type="number" value={appraisals[p.id] || ''} onChange={e => handleValueChange(p.id, e.target.value)} placeholder="Market Value" className="block p-2 border rounded mt-2" />
            <button onClick={() => handleSubmit(p.id)} className="bg-blue-500 text-white p-1 rounded mt-2">Submit Appraisal</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppraiserDashboard; 