import { useEffect, useRef, useState } from 'react';

interface BynnSDK {
  mount: (options: { submitBtnText: string; loadingText: string }) => void;
}

interface CreateBynnOptions {
  apiKey: string;
  parentId: string;
  i18n: string;
  kycLevel: string;
  fields: Array<{
    name: string;
    visible: boolean;
    label: string;
    value?: string;
  }>;
  onSession?: (error: any, response: any, sessionId: string) => void;
  onTimeout?: (sessionId: string) => void;
  onCancel?: () => void;
  onComplete?: (sessionId: string) => void;
  onError?: (sessionId: string, error: any) => void;
  onStart?: (sessionId: string) => void;
}

declare global {
  interface Window {
    createBynn?: {
      default: (options: CreateBynnOptions) => BynnSDK;
    };
  }
}

interface BynnVerificationProps {
  onVerificationComplete?: (sessionId: string) => void;
  onVerificationError?: (error: any) => void;
  userEmail?: string;
  userPhone?: string;
  uniqueId?: string;
}

export default function BynnVerification({
  onVerificationComplete,
  onVerificationError,
  userEmail,
  userPhone,
  uniqueId,
}: BynnVerificationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for Bynn SDK to load
    const checkBynn = setInterval(() => {
      if (window.createBynn) {
        clearInterval(checkBynn);
        initializeBynn();
      }
    }, 100);

    // Timeout after 10 seconds
    const timeout = setTimeout(() => {
      clearInterval(checkBynn);
      if (!window.createBynn) {
        setError('Failed to load Bynn SDK');
        setIsLoading(false);
      }
    }, 10000);

    return () => {
      clearInterval(checkBynn);
      clearTimeout(timeout);
    };
  }, []);

  const initializeBynn = () => {
    if (!window.createBynn) {
      setError('Bynn SDK not available');
      setIsLoading(false);
      return;
    }

    try {
      const bynn = window.createBynn.default({
        apiKey: 'public_FY8dw9hG7Zp4WzmMH4HyH8XM',
        parentId: 'bynn-verify-form',
        i18n: 'en',
        kycLevel: 'KP7G36RUP',
        fields: [
          {
            name: 'first_name',
            visible: true,
            label: 'First Name',
          },
          {
            name: 'last_name',
            visible: true,
            label: 'Last Name',
          },
          {
            name: 'email_address',
            visible: false,
            label: 'Email Address',
            value: userEmail || '',
          },
          {
            name: 'phone_number',
            visible: false,
            label: 'Phone Number',
            value: userPhone || '',
          },
          {
            name: 'unique_id',
            visible: false,
            label: 'UUID',
            value: uniqueId || `USER_${Date.now()}`,
          },
        ],
        onSession: (error, response, sessionId) => {
          if (error) {
            console.error('Verification error:', error);
            setError('Verification session error');
            onVerificationError?.(error);
          }
          if (response) {
            console.log('Verification onSession id:', response.sessionId);
          }
        },
        onTimeout: (sessionId) => {
          console.log('Verification timed out, session id:', sessionId);
          setError('Verification timed out');
        },
        onCancel: () => {
          console.log('Verification canceled');
        },
        onComplete: (sessionId) => {
          console.log('Verification completed, session id:', sessionId);
          onVerificationComplete?.(sessionId);
        },
        onError: (sessionId, error) => {
          console.log('Verification error, session id, error:', sessionId, error);
          setError('Verification failed');
          onVerificationError?.(error);
        },
        onStart: (sessionId) => {
          console.log('Verification started, session id:', sessionId);
          setIsLoading(false);
        },
      });

      bynn.mount({
        submitBtnText: 'Start Document Verification',
        loadingText: 'Starting verification...',
      });

      setIsLoading(false);
    } catch (err) {
      console.error('Failed to initialize Bynn:', err);
      setError('Failed to initialize verification');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Loading verification system...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
      
      <div id="bynn-verify-form" ref={containerRef} className="w-full"></div>
    </div>
  );
}
