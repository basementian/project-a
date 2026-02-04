'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OTPInput } from '@/components/auth/OTPInput';
import { verifyOTP } from '@/services/auth';

export default function VerifyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    const stored = sessionStorage.getItem('dibs_phone');
    if (!stored) {
      router.replace('/login');
      return;
    }
    setPhone(stored);
  }, [router]);

  const handleSubmit = async (code: string) => {
    setLoading(true);
    setError('');
    try {
      const result = await verifyOTP(phone, code);
      if (result.success) {
        sessionStorage.removeItem('dibs_phone');
        router.replace('/map');
      } else {
        setError('Invalid code. Try again.');
      }
    } catch {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen px-6 pt-20">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Enter code</h1>
        <p className="text-gray-500">
          We sent a verification code to {phone}
        </p>
      </div>
      <OTPInput onSubmit={handleSubmit} loading={loading} error={error} />
    </div>
  );
}
