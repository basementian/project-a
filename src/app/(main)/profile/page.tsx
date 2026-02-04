'use client';

import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StarRating } from '@/components/ui/StarRating';
import { useAuthStore } from '@/stores/useAuthStore';
import { signOut } from '@/services/auth';

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);

  const handleSignOut = async () => {
    await signOut();
    clear();
    router.replace('/login');
  };

  if (!user) return null;

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Profile" />
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 space-y-4">
        {/* User info */}
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-dip-primary/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-dip-primary">
                {(user.display_name || 'U')[0].toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-semibold">{user.display_name || 'User'}</h2>
              {user.phone && (
                <p className="text-sm text-gray-500">{user.phone}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Ratings */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Rating</h3>
          <div className="flex items-center gap-3">
            <StarRating value={Math.round(user.average_rating)} readonly />
            <span className="text-sm text-gray-500">
              {user.average_rating > 0
                ? `${user.average_rating.toFixed(1)} (${user.total_ratings} ratings)`
                : 'No ratings yet'}
            </span>
          </div>
        </Card>

        {/* Stats */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Member since</h3>
          <p className="text-sm text-gray-700">
            {new Date(user.created_at).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </Card>

        {/* Sign out */}
        <Button
          variant="danger"
          fullWidth
          onClick={handleSignOut}
        >
          Sign out
        </Button>
      </div>
    </div>
  );
}
