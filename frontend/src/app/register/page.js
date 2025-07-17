'use client'

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { register } from '../../services/auth';

const Register = () => {
  const router = useRouter();
  const [data, setData] = useState({
    username: '',
    email: '',
    password: '',
    user_type: 'buyer',
    userprofile: { address: '', phone_number: '', eth_address: '' }
  });

  const handleChange = (e) => {
    const [section, name] = e.target.name.split('.');
    if (section === 'userprofile') {
      setData({ ...data, userprofile: { ...data.userprofile, [name]: e.target.value } });
    } else {
      setData({ ...data, [name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(data);
      alert('Registered successfully. Please login.');
      router.push('/login');
    } catch (err) {
      alert('Error registering');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Register</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="username" value={data.username} onChange={handleChange} placeholder="Username" className="block w-full p-2 border rounded" />
        <input name="email" value={data.email} onChange={handleChange} placeholder="Email" className="block w-full p-2 border rounded" />
        <input name="password" type="password" value={data.password} onChange={handleChange} placeholder="Password" className="block w-full p-2 border rounded" />
        <select name="user_type" value={data.user_type} onChange={handleChange} className="block w-full p-2 border rounded">
          <option value="buyer">Buyer</option>
          <option value="seller">Seller</option>
          <option value="inspector">Inspector</option>
          <option value="appraiser">Appraiser</option>
          <option value="admin">Admin</option>
        </select>
        <input name="userprofile.address" value={data.userprofile.address} onChange={handleChange} placeholder="Address" className="block w-full p-2 border rounded" />
        <input name="userprofile.phone_number" value={data.userprofile.phone_number} onChange={handleChange} placeholder="Phone Number" className="block w-full p-2 border rounded" />
        <input name="userprofile.eth_address" value={data.userprofile.eth_address} onChange={handleChange} placeholder="ETH Address" className="block w-full p-2 border rounded" />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded w-full">Register</button>
      </form>
    </div>
  );
};

export default Register; 