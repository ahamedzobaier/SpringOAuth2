export interface FlowStep {
  id: number;
  from: 'User' | 'Client' | 'AuthServer' | 'ResourceServer';
  to: 'User' | 'Client' | 'AuthServer' | 'ResourceServer';
  label: string;
  description: string;
  details: string;
}

export interface OAuthFlow {
  id: string;
  name: string;
  recommended: boolean;
  deprecated: boolean;
  securityRating: 'A+' | 'A' | 'B' | 'D' | 'F';
  useCase: string;
  description: string;
  steps: FlowStep[];
  technicalDetails: string;
}

export const oauthFlows: OAuthFlow[] = [
  {
    id: 'auth-code-pkce',
    name: 'Authorization Code Flow with PKCE',
    recommended: true,
    deprecated: false,
    securityRating: 'A+',
    useCase: 'Single Page Apps (React, Vue, Angular), Mobile Apps, Native Desktop Apps.',
    description: 'The modern gold standard for client-side applications. PKCE (Proof Key for Code Exchange) protects the authorization code from interception by adding a dynamically generated secret challenge.',
    technicalDetails: 'Standard: RFC 7636. Replaces the implicit flow for public clients. Uses SHA-256 for hashing code challenges.',
    steps: [
      {
        id: 1,
        from: 'Client',
        to: 'User',
        label: '1. Generate PKCE Secrets',
        description: 'Client generates a cryptographically secure random "code_verifier" and hashes it using SHA-256 to create the "code_challenge".',
        details: 'The code verifier is kept private. The code challenge is prepared for the auth server.'
      },
      {
        id: 2,
        from: 'Client',
        to: 'AuthServer',
        label: '2. Authorization Request',
        description: 'Client redirects the user\'s browser to the Authorization Server, sending the client_id, response_type=code, code_challenge, and code_challenge_method=S256.',
        details: 'Auth Server registers the client and stores the challenge for validation later.'
      },
      {
        id: 3,
        from: 'User',
        to: 'AuthServer',
        label: '3. Login & Consent',
        description: 'The User authenticates with the Authorization Server (e.g., via Google/GitHub credentials) and grants consent for access scopes.',
        details: 'This step is completely isolated from the Client app. The Client never sees user credentials.'
      },
      {
        id: 4,
        from: 'AuthServer',
        to: 'Client',
        label: '4. Redirect with Auth Code',
        description: 'Authorization Server redirects browser back to Client\'s redirect_uri, passing a temporary, short-lived "authorization code".',
        details: 'This code is exposed to the browser, making it vulnerable to interception. This is where PKCE provides security.'
      },
      {
        id: 5,
        from: 'Client',
        to: 'AuthServer',
        label: '5. Token Request (with Verifier)',
        description: 'Client sends the authorization code along with the raw, plaintext "code_verifier" directly to the Auth Server (/token endpoint).',
        details: 'This is a secure back-channel (direct HTTPS) request, bypassing the browser.'
      },
      {
        id: 6,
        from: 'AuthServer',
        to: 'Client',
        label: '6. Verification & Token Return',
        description: 'Auth Server hashes the received "code_verifier" using SHA-256. If it matches the original "code_challenge", it returns the Access Token and Refresh Token.',
        details: 'If an attacker intercepted the authorization code in step 4, they cannot exchange it because they lack the raw code_verifier.'
      },
      {
        id: 7,
        from: 'Client',
        to: 'ResourceServer',
        label: '7. Access Protected API',
        description: 'Client calls API endpoints on the Resource Server, supplying the Access Token in the Authorization header (Bearer token).',
        details: 'The Resource Server verifies the token and returns the requested user profile data.'
      }
    ]
  },
  {
    id: 'auth-code',
    name: 'Authorization Code Flow',
    recommended: true,
    deprecated: false,
    securityRating: 'A',
    useCase: 'Traditional Server-side Web Apps (Node.js, Spring Boot, Python/Django) with confidential backends.',
    description: 'The standard flow for apps that can securely store a client secret on a private server. The server performs the token exchange directly, keeping credentials secure.',
    technicalDetails: 'Standard: RFC 6749 Section 4.1. Requires a confidential client capable of keeping secrets.',
    steps: [
      {
        id: 1,
        from: 'Client',
        to: 'AuthServer',
        label: '1. Authorization Request',
        description: 'Client redirects User\'s browser to the Authorization Server, passing client_id and response_type=code.',
        details: 'No PKCE parameters are sent because the server backend can authenticate with its own client secret.'
      },
      {
        id: 2,
        from: 'User',
        to: 'AuthServer',
        label: '2. Login & Consent',
        description: 'The User authenticates directly with the Auth Server and approves the requested permissions.',
        details: 'Auth Server records consent for the Client.'
      },
      {
        id: 3,
        from: 'AuthServer',
        to: 'Client',
        label: '3. Redirect with Auth Code',
        description: 'Auth Server redirects browser to Client\'s backend callback with a temporary "authorization code".',
        details: 'The redirect goes to the backend server route (e.g. /login/oauth2/code/google).'
      },
      {
        id: 4,
        from: 'Client',
        to: 'AuthServer',
        label: '4. Token Request (with Secret)',
        description: 'Client backend calls the Auth Server /token endpoint directly, providing the authorization code, client_id, and confidential client_secret.',
        details: 'Since this is server-to-server, the client_secret is never exposed to the browser or user.'
      },
      {
        id: 5,
        from: 'AuthServer',
        to: 'Client',
        label: '5. Return Tokens',
        description: 'Auth Server validates the authorization code and client credentials, then returns the Access Token and Refresh Token.',
        details: 'Tokens are stored in the server-side session, and the server returns a session cookie to the browser.'
      },
      {
        id: 6,
        from: 'Client',
        to: 'ResourceServer',
        label: '6. Call API',
        description: 'Client backend calls the Resource Server API using the Access Token in the Authorization header.',
        details: 'Enables backend integration with external user services.'
      }
    ]
  },
  {
    id: 'client-credentials',
    name: 'Client Credentials Flow',
    recommended: true,
    deprecated: false,
    securityRating: 'A',
    useCase: 'Machine-to-Machine (M2M) communication, microservices, backend daemons, cron jobs.',
    description: 'Used when the client app itself is the resource owner (no human user is involved). The application authenticates directly with its own credentials to obtain access.',
    technicalDetails: 'Standard: RFC 6749 Section 4.4. Ideal for server-to-server integrations where user authorization is irrelevant.',
    steps: [
      {
        id: 1,
        from: 'Client',
        to: 'AuthServer',
        label: '1. Token Request',
        description: 'Client makes a direct POST request to the Auth Server\'s /token endpoint with grant_type=client_credentials, passing its client_id and client_secret.',
        details: 'This is a direct server-to-server API call.'
      },
      {
        id: 2,
        from: 'AuthServer',
        to: 'Client',
        label: '2. Return Token',
        description: 'Auth Server verifies the client credentials. If valid, it returns an Access Token directly.',
        details: 'No Refresh Tokens are typically issued in this flow since the client can request new tokens easily using client secrets.'
      },
      {
        id: 3,
        from: 'Client',
        to: 'ResourceServer',
        label: '3. Call API',
        description: 'Client calls the backend Resource Server API with the token to perform system-level tasks.',
        details: 'Used to sync data, read service configs, or execute scheduled jobs.'
      }
    ]
  },
  {
    id: 'device-authorization',
    name: 'Device Authorization Flow',
    recommended: true,
    deprecated: false,
    securityRating: 'A',
    useCase: 'Smart TVs, CLI tools (like git, aws-cli), gaming consoles, and IoT devices.',
    description: 'Designed for internet-connected devices that either lack a web browser or have highly restricted input capabilities (making it difficult to type usernames/passwords).',
    technicalDetails: 'Standard: RFC 8628. Offloads authentication to a secondary device (like a smartphone or laptop).',
    steps: [
      {
        id: 1,
        from: 'Client',
        to: 'AuthServer',
        label: '1. Device Auth Request',
        description: 'Device requests a device code from the Auth Server, passing its client_id.',
        details: 'This is triggered when a user clicks "Log in from TV" or runs a CLI login command.'
      },
      {
        id: 2,
        from: 'AuthServer',
        to: 'Client',
        label: '2. Return Codes & URI',
        description: 'Auth Server returns a unique user_code, device_code, verification_uri, and polling interval.',
        details: 'The device_code is kept internal, while the user_code and verification_uri are displayed to the user.'
      },
      {
        id: 3,
        from: 'Client',
        to: 'User',
        label: '3. Display Instructions',
        description: 'Device displays the verification URL and code on screen, prompting the user to visit the link and enter the code.',
        details: 'For ease of use, a QR code containing the URL and user_code is often generated.'
      },
      {
        id: 4,
        from: 'Client',
        to: 'AuthServer',
        label: '4. Start Polling',
        description: 'The Device client starts polling the Auth Server\'s /token endpoint in the background using the device_code.',
        details: 'It polls periodically (e.g., every 5 seconds) to check if the user has authenticated.'
      },
      {
        id: 5,
        from: 'User',
        to: 'AuthServer',
        label: '5. Authenticate on Secondary Device',
        description: 'User opens the verification_uri on their smartphone/PC, logs in, and enters the displayed user_code.',
        details: 'This keeps login secure since the user inputs their password on a trusted personal browser.'
      },
      {
        id: 6,
        from: 'AuthServer',
        to: 'Client',
        label: '6. Access Token Issued',
        description: 'On the next poll request, the Auth Server detects that authorization is complete and returns the Access Token.',
        details: 'The Device client stops polling and saves the tokens.'
      }
    ]
  },
  {
    id: 'implicit',
    name: 'Implicit Flow',
    recommended: false,
    deprecated: true,
    securityRating: 'F',
    useCase: 'Legacy Single Page Applications. (Obsolete, DO NOT USE).',
    description: 'An old flow where the client app received the Access Token directly in the redirect URL fragment, bypassing the authorization code step. It is highly insecure.',
    technicalDetails: 'Standard: RFC 6749 Section 4.2. Formally deprecated by OAuth 2.1 due to vulnerability to token theft and lack of client authentication.',
    steps: [
      {
        id: 1,
        from: 'Client',
        to: 'AuthServer',
        label: '1. Authorization Request',
        description: 'Client redirects browser to Auth Server with response_type=token.',
        details: 'This tells the server to return the token directly without returning a code first.'
      },
      {
        id: 2,
        from: 'User',
        to: 'AuthServer',
        label: '2. Login & Consent',
        description: 'User enters credentials and logs in.',
        details: 'Requires user validation.'
      },
      {
        id: 3,
        from: 'AuthServer',
        to: 'Client',
        label: '3. Token returned in URL',
        description: 'Auth Server redirects back to redirect_uri, passing the Access Token in the hash fragment of the URL (#access_token=...).',
        details: 'Security vulnerability: The token is exposed in browser history, referer headers, and can be read by malicious scripts running in the page.'
      },
      {
        id: 4,
        from: 'Client',
        to: 'ResourceServer',
        label: '4. Call API',
        description: 'Client extracts the token from URL and uses it to call the Resource Server API.',
        details: 'The token has no validation checks and can easily be compromised.'
      }
    ]
  },
  {
    id: 'password',
    name: 'Resource Owner Password Credentials',
    recommended: false,
    deprecated: true,
    securityRating: 'D',
    useCase: 'Legacy trusted internal systems. (Obsolete, DO NOT USE).',
    description: 'Requires the user to type their username and password directly into the client app, which then sends them to the authorization server. This defeats the primary goal of OAuth (never sharing passwords with clients).',
    technicalDetails: 'Standard: RFC 6749 Section 4.3. Deprecated in OAuth 2.1 because it trains users to enter credentials in untrusted apps and requires high trust.',
    steps: [
      {
        id: 1,
        from: 'User',
        to: 'Client',
        label: '1. Enter Credentials',
        description: 'User inputs username and password directly into the Client app interface.',
        details: 'Severe security risk: The Client has raw, unhashed access to the user\'s credentials.'
      },
      {
        id: 2,
        from: 'Client',
        to: 'AuthServer',
        label: '2. Token Request',
        description: 'Client sends the username and password, along with its client credentials, directly to the /token endpoint.',
        details: 'Request parameters are grant_type=password, username, password.'
      },
      {
        id: 3,
        from: 'AuthServer',
        to: 'Client',
        label: '3. Issue Access Token',
        description: 'Auth Server validates the credentials and returns the Access Token.',
        details: 'Client saves the token and discards the credentials (hopefully).'
      }
    ]
  },
  {
    id: 'refresh-token',
    name: 'Refresh Token Flow',
    recommended: true,
    deprecated: false,
    securityRating: 'A',
    useCase: 'Maintaining active sessions without requiring users to log in repeatedly.',
    description: 'Allows clients to request a new Access Token after the original expires. Refresh tokens are long-lived and can be used on the back-channel without user interaction.',
    technicalDetails: 'Standard: RFC 6749 Section 1.5. In public clients, Refresh Token Rotation is recommended to prevent theft.',
    steps: [
      {
        id: 1,
        from: 'Client',
        to: 'ResourceServer',
        label: '1. Access Token Expired',
        description: 'Client calls API, but receives a 401 Unauthorized because the Access Token is expired.',
        details: 'Access tokens typically have short lifetimes (e.g., 1 hour) for security.'
      },
      {
        id: 2,
        from: 'Client',
        to: 'AuthServer',
        label: '2. Token Refresh Request',
        description: 'Client calls Auth Server /token endpoint directly, providing the refresh_token (and client credentials if confidential).',
        details: 'grant_type=refresh_token.'
      },
      {
        id: 3,
        from: 'AuthServer',
        to: 'Client',
        label: '3. Return New Tokens',
        description: 'Auth Server validates the refresh token, invalidates the old one (if using rotation), and returns a new Access Token and a new Refresh Token.',
        details: 'This ensures continuous, seamless access for the user.'
      },
      {
        id: 4,
        from: 'Client',
        to: 'ResourceServer',
        label: '4. Retry API Call',
        description: 'Client calls API again with the new Access Token, which successfully returns the data.',
        details: 'Completed silently in the background without disturbing the user.'
      }
    ]
  }
];
