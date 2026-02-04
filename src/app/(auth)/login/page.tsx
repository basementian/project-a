'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PhoneInput } from '@/components/auth/PhoneInput';
import { sendOTP } from '@/services/auth';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (phone: string) => {
    setLoading(true);
    try {
      const { success } = await sendOTP(phone);
      if (success) {
        sessionStorage.setItem('dibs_phone', phone);
        router.push('/verify');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen px-6 pt-20">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome to DIBS</h1>
        <p className="text-gray-500">
          Share access. Save time. Enter your phone number to get started.
        </p>
      </div>
      <PhoneInput onSubmit={handleSubmit} loading={loading} />
    </div>
  );
}
