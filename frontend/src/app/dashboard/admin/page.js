'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '../../../services/auth';
import { getUsers, deleteUser } from '../../../services/user';
import { getProperties, deleteProperty } from '../../../services/property';
import PropertyCard from '../../../components/PropertyCard';

const AdminDashboard = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const u = await getCurrentUser();
        if (!u.is_superuser) {
          router.push('/login');
          return;
        }
        setUser(u);
        const usrs = await getUsers();
        setUsers(usrs);
        const props = await getProperties();
        setProperties(props);
      } catch (err) {
        router.push('/login');
      }
    };
    fetchData();
  }, [router]);

  const handleDeleteUser = async (id) => {
    if (confirm('Delete user?')) {
      await deleteUser(id);
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const handleDeleteProperty = async (id) => {
    if (confirm('Delete property?')) {
      await deleteProperty(id);
      setProperties(properties.filter(p => p.id !== id));
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <h2 className="text-xl mb-2">Users</h2>
      <div className="grid grid-cols-1 gap-4 mb-8">
        {users.map(u => (
          <div key={u.id} className="p-4 border rounded shadow flex justify-between">
            <div>
              <p>Username: {u.username}</p>
              <p>Type: {u.user_type}</p>
              <p>Email: {u.email}</p>
            </div>
            <button onClick={() => handleDeleteUser(u.id)} className="bg-red-500 text-white p-1 rounded">Delete</button>
          </div>
        ))}
      </div>
      <h2 className="text-xl mb-2">Properties</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {properties.map(p => (
          <div key={p.id} className="relative">
            <PropertyCard property={p} showLink={true} />
            <button onClick={() => handleDeleteProperty(p.id)} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard; 