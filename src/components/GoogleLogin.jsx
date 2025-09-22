import React, { useEffect, useState } from 'react';

const GoogleLogin = ({ onSuccess, onError }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [clientId, setClientId] = useState('');

  useEffect(() => {
    // 獲取Google OAuth配置
    fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/auth/google-config`)
      .then(response => response.json())
      .then(data => {
        if (data.success && data.enabled) {
          setClientId(data.client_id);
          loadGoogleScript();
        }
      })
      .catch(error => {
        console.error('獲取Google配置失敗:', error);
      });
  }, []);

  const loadGoogleScript = () => {
    if (window.google) {
      initializeGoogleSignIn();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      initializeGoogleSignIn();
    };
    document.head.appendChild(script);
  };

  const initializeGoogleSignIn = () => {
    if (window.google && clientId) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-button'),
        {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'signin_with',
          locale: 'zh_TW'
        }
      );

      setIsLoaded(true);
    }
  };

  const handleCredentialResponse = async (response) => {
    try {
      const result = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/auth/google-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          credential: response.credential
        })
      });

      const data = await result.json();

      if (data.success) {
        onSuccess(data.user);
      } else {
        onError(data.message || 'Google登入失敗');
      }
    } catch (error) {
      onError('網路錯誤，請稍後再試');
    }
  };

  if (!clientId) {
    return (
      <div className="w-full p-4 text-center text-gray-500">
        <p>Google登入功能正在載入...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4 text-center">
        <span className="text-gray-500">或</span>
      </div>
      <div id="google-signin-button" className="w-full"></div>
      {!isLoaded && (
        <div className="w-full p-4 text-center text-gray-500">
          <p>正在載入Google登入...</p>
        </div>
      )}
    </div>
  );
};

export default GoogleLogin;
