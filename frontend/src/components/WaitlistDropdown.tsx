'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface WaitlistDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WaitlistDropdown({ isOpen, onClose }: WaitlistDropdownProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setMessage('Please enter your email');
      setStatus('error');
      return;
    }

    setStatus('loading');
    
    try {
      // TODO: Implement actual waitlist API endpoint to collect emails in backend
      // Need to create POST /api/waitlist endpoint that saves email to database
      // For now, just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStatus('success');
      setMessage('🎉 You&apos;re on the list! We&apos;ll notify you when we launch.');
      setEmail('');
      
      // Close after 3 seconds on success
      setTimeout(() => {
        onClose();
        setStatus('idle');
        setMessage('');
      }, 3000);
    } catch (error) {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Dropdown */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={24} />
        </button>
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Join the Waitlist
          </h2>
          <p className="text-gray-600">
            Be the first to know when we launch and get exclusive early access!
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              disabled={status === 'loading' || status === 'success'}
            />
          </div>
          
          {message && (
            <div className={`text-sm text-center ${
              status === 'success' ? 'text-green-600' : 
              status === 'error' ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              {message}
            </div>
          )}
          
          <button
            type="submit"
            disabled={status === 'loading' || status === 'success'}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
              status === 'loading' || status === 'success'
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {status === 'loading' ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Joining...
              </span>
            ) : status === 'success' ? (
              '✓ You&apos;re on the list!'
            ) : (
              'Join Waitlist'
            )}
          </button>
        </form>
        
        <p className="text-xs text-gray-500 text-center mt-4">
          We respect your privacy and won&apos;t spam you. Unsubscribe anytime.
        </p>
      </div>
    </div>
  );
}