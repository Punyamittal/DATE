import { Suspense } from 'react';
import VerifyEmail from '../components/auth/VerifyEmail';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-8"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-700"></div></div>}>
      <VerifyEmail />
    </Suspense>
  );
} 