// src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PrivyProvider } from '@privy-io/react-auth';
import { polygonAmoy } from 'viem/chains';
import './index.css';
import App from './App.jsx';

// Fallback sandbox app ID for Privy if not provided
const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || "sandbox";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ['email', 'google'],
        appearance: {
          theme: 'dark',
          accentColor: '#ff8d8a',
          showWalletLoginFirst: false,
        },
        embeddedWallets: {
          createOnLogin: 'all-users',
        },
        defaultChain: polygonAmoy,
        supportedChains: [polygonAmoy]
      }}
    >
      <App />
    </PrivyProvider>
  </StrictMode>,
);
