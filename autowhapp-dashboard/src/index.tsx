import React from 'react';
import ReactDOM from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Add this console.log to debug
console.log('Auth0 Domain:', process.env.REACT_APP_AUTH0_DOMAIN);
console.log('Auth0 Client ID:', process.env.REACT_APP_AUTH0_CLIENT_ID);

const redirectUri = window.location.origin;
console.log('Redirect URI:', redirectUri); // Para ver qué URL se está usando

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Auth0Provider
      domain="dev-15eg10mp60jkcv6l.us.auth0.com"
      clientId="lMpFyi8jIoSYqf38GvrvFiFF3Gko8cPK"
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: "https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/",
        scope: "openid profile email read:negocios write:negocios"
      }}
    >
      <App />
    </Auth0Provider>
  </React.StrictMode>
);

reportWebVitals();
