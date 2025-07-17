'use client'

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { login, getCurrentUser } from '../../services/auth';

const Login = () => {
  const router = useRouter();
  const [credentials, setCredentials] = useState({ username: '', password: '' });

  const handleChange = (e) => setCredentials({ ...credentials, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(credentials);
      const user = await getCurrentUser();
      if (user.is_superuser) {
        router.push('/dashboard/admin');
      } else {
        router.push(`/dashboard/${user.user_type}`);
      }
    } catch (err) {
      alert('Error logging in');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="username" value={credentials.username} onChange={handleChange} placeholder="Username" className="block w-full p-2 border rounded" />
        <input name="password" type="password" value={credentials.password} onChange={handleChange} placeholder="Password" className="block w-full p-2 border rounded" />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded w-full">Login</button>
      </form>
    </div>
  );
};

export default Login; 