'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { getCurrentUser } from '../services/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (user.is_superuser) {
          router.push('/dashboard/admin');
        } else {
          router.push(`/dashboard/${user.user_type}`);
        }
      } catch (err) {
        // Not logged in, stay on home
      }
    };
    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <h1 className="text-4xl font-bold mb-4">Welcome to Blockchain Real Estate</h1>
      <p className="text-xl mb-8">Buy, sell, and manage properties securely on the blockchain.</p>
      <div className="space-x-4">
        <Link href="/login" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Login</Link>
        <Link href="/register" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Register</Link>
      </div>
    </div>
  );
}
