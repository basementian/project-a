'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface PhoneInputProps {
  onSubmit: (phone: string) => void;
  loading?: boolean;
}

export function PhoneInput({ onSubmit, loading }: PhoneInputProps) {
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length >= 10) {
      onSubmit(phone);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Phone number"
        type="tel"
        placeholder="(555) 123-4567"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        autoFocus
      />
      <Button
        type="submit"
        fullWidth
        loading={loading}
        disabled={phone.length < 10}
      >
        Continue
      </Button>
    </form>
  );
}
