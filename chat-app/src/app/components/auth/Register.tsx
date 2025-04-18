'use client';

import React, { useState, FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: '',
    lookingFor: ''
  });
  
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);
  const [devModeToken, setDevModeToken] = useState<string | null>(null);
  const [verificationIssue, setVerificationIssue] = useState(false);
  
  const { register, loading, error, clearError } = useAuth();
  
  const { name, email, password, confirmPassword, gender, lookingFor } = formData;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    clearError();
    setSuccess(false);
    setDevModeToken(null);
    setVerificationIssue(false);
    
    // Validation
    if (!name || !email || !password || !confirmPassword || !gender || !lookingFor) {
      setSubmitError('Please fill in all fields');
      return;
    }
    
    if (!email.endsWith('@vitstudent.ac.in')) {
      setSubmitError('Please use your VIT student email (@vitstudent.ac.in)');
      return;
    }
    
    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setSubmitError('Password must be at least 6 characters long');
      return;
    }
    
    try {
      const response = await register({ name, email, password, gender, lookingFor });
      
      // Check for development mode or verification issues
      if (response && typeof response === 'object') {
        if ('devModeToken' in response) {
          setDevModeToken(response.devModeToken as string);
        }
        if ('verificationIssue' in response) {
          setVerificationIssue(true);
        }
      }
      
      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        gender: '',
        lookingFor: ''
      });
    } catch (err) {
      console.error('Registration error:', err);
    }
  };
  
  if (success) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center p-4">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-indigo-700">Registration Successful!</h1>
            <div className="mt-6">
              {devModeToken ? (
                <div className="mb-6">
                  <p className="text-amber-600 font-semibold mb-2">DEVELOPMENT MODE ACTIVE</p>
                  <p className="text-gray-600 mb-4">
                    Your account is automatically verified in development mode.
                  </p>
                  <div className="bg-gray-100 p-3 rounded text-sm mb-4">
                    <p className="font-mono break-all">Verification Token: {devModeToken}</p>
                  </div>
                </div>
              ) : verificationIssue ? (
                <p className="text-orange-600 mb-4">
                  Your account was created, but we couldn't send a verification email. 
                  Please contact support for assistance.
                </p>
              ) : (
                <p className="text-gray-600 mb-4">
                  Please check your VIT email inbox to verify your account. 
                  You can login after verifying your email.
                </p>
              )}
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
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-indigo-700">VIT Dating App</h1>
          <p className="mt-2 text-gray-600">Create your account</p>
        </div>
        
        {(error || submitError) && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{submitError || error}</span>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={handleChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Your Name"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                VIT Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={handleChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="your.name@vitstudent.ac.in"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={handleChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password (minimum 6 characters)"
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={handleChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Confirm your password"
              />
            </div>
            
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                required
                value={gender}
                onChange={handleChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="lookingFor" className="block text-sm font-medium text-gray-700 mb-1">
                Looking For
              </label>
              <select
                id="lookingFor"
                name="lookingFor"
                required
                value={lookingFor}
                onChange={handleChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              >
                <option value="">Looking For</option>
                <option value="male">Men</option>
                <option value="female">Women</option>
                <option value="both">Both</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
        
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;