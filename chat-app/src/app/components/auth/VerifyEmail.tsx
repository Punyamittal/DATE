'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const VerifyEmail = () => {
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const { verifyEmail, loading, error } = useAuth();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setVerifying(false);
        setErrorMsg('Invalid verification link. No token provided.');
        return;
      }
      
      try {
        await verifyEmail(token);
        setVerifying(false);
        setVerified(true);
      } catch (err) {
        setVerifying(false);
        setErrorMsg('Failed to verify email. The link may be expired or invalid.');
      }
    };
    
    verify();
  }, [token, verifyEmail]);
  
  if (verifying || loading) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center p-4">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-indigo-700">Verifying Your Email</h1>
            <div className="mt-6">
              <p className="text-gray-600 mb-4">Please wait while we verify your email...</p>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-700"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (verified) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center p-4">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-green-600">Email Verified!</h1>
            <div className="mt-6">
              <p className="text-gray-600 mb-4">
                Your email has been successfully verified. You can now log in to your account.
              </p>
              <Link 
                href="/login" 
                className="inline-block bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
              >
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-600">Verification Failed</h1>
          <div className="mt-6">
            <p className="text-gray-600 mb-4">
              {errorMsg || error || 'Failed to verify your email. Please try again.'}
            </p>
            <Link 
              href="/register" 
              className="inline-block bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
            >
              Go to Registration
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail; 