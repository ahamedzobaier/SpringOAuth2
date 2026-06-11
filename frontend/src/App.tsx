import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Lock, 
  User as UserIcon, 
  Layers, 
  RefreshCw, 
  Cpu, 
  ChevronRight,
  ChevronLeft,
  Info
} from 'lucide-react';
import type { OAuthFlow } from './flowsData';
import { oauthFlows } from './flowsData';

const GithubIcon = ({ size = 16, className = "", style = {} }: { size?: number; className?: string; style?: React.CSSProperties }) => (
  <svg 
    viewBox="0 0 24 24" 
    width={size} 
    height={size} 
    stroke="currentColor" 
    strokeWidth="2" 
    fill="none" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
    style={style}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  provider: string;
  location: string;
  address: string;
  contactInfo: string;
  profileComplete: boolean;
}

interface AuthState {
  authenticated: boolean;
  profileComplete?: boolean;
  name?: string;
  email?: string;
  avatarUrl?: string;
  provider?: string;
  profile?: UserProfile;
  attributes?: Record<string, any>;
  authorities?: string[];
}

export default function App() {
  const [selectedFlowId, setSelectedFlowId] = useState<string>('auth-code-pkce');
  const [activeStepId, setActiveStepId] = useState<number>(1);
  const [authState, setAuthState] = useState<AuthState>({ authenticated: false });
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);
  const [securedMessage, setSecuredMessage] = useState<string>('');
  const [path, setPath] = useState<string>(window.location.pathname);
  const [profileSubTab, setProfileSubTab] = useState<'edit' | 'claims' | 'scopes' | 'delete'>('edit');

  // Users List State
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true);

  // Profile Edit State
  const [editLocation, setEditLocation] = useState<string>('');
  const [editAddress, setEditAddress] = useState<string>('');
  const [editContactInfo, setEditContactInfo] = useState<string>('');
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>('');

  // Authentication States
  const authError = '';

  // Profile Completion State
  const [completionName, setCompletionName] = useState<string>('');
  const [completionEmail, setCompletionEmail] = useState<string>('');
  const [completionLocation, setCompletionLocation] = useState<string>('');
  const [completionAddress, setCompletionAddress] = useState<string>('');
  const [completionContactInfo, setCompletionContactInfo] = useState<string>('');
  const [completionPassword, setCompletionPassword] = useState<string>('');
  const [completingProfile, setCompletingProfile] = useState<boolean>(false);
  const [deletingAccount, setDeletingAccount] = useState<boolean>(false);

  const navigate = (newPath: string) => {
    window.history.pushState({}, '', newPath);
    setPath(newPath);
  };

  const fetchUsers = () => {
    setLoadingUsers(true);
    fetch('/api/users')
      .then(res => res.json())
      .then((data: UserProfile[]) => {
        setUsersList(data);
        setLoadingUsers(false);
      })
      .catch(err => {
        console.error('Failed to fetch users list:', err);
        setLoadingUsers(false);
      });
  };

  useEffect(() => {
    // Redirect / to /home
    if (window.location.pathname === '/') {
      navigate('/home');
    }

    const handlePopState = () => {
      setPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);

    fetch('/user')
      .then(res => res.json())
      .then((data: AuthState) => {
        setAuthState(data);
        if (data.profile) {
          setEditLocation(data.profile.location || '');
          setEditAddress(data.profile.address || '');
          setEditContactInfo(data.profile.contactInfo || '');
        }
        setCompletionName(data.name || '');
        setCompletionEmail(data.email || '');
        setCompletionLocation('');
        setCompletionAddress('');
        setCompletionContactInfo('');
        setCompletionPassword('');
        setLoadingAuth(false);
      })
      .catch(err => {
        console.error('Failed to fetch user session:', err);
        setLoadingAuth(false);
      });

    fetchUsers();

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Route guarding/redirects
  useEffect(() => {
    if (!loadingAuth) {
      if (authState.authenticated) {
        if (path === '/login' || path === '/signup') {
          navigate('/profile');
        }
      } else {
        if (path === '/profile') {
          navigate('/login');
        }
      }
    }
  }, [authState.authenticated, path, loadingAuth]);


  const handleSaveProfile = (e: FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setSaveStatus('');
    
    fetch('/api/users/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        location: editLocation,
        address: editAddress,
        contactInfo: editContactInfo
      })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to update profile');
        return res.json();
      })
      .then((updatedProfile: UserProfile) => {
        setAuthState(prev => ({
          ...prev,
          profile: updatedProfile
        }));
        setSavingProfile(false);
        setSaveStatus('Success! Profile updated.');
        fetchUsers();
      })
      .catch(err => {
        console.error(err);
        setSavingProfile(false);
        setSaveStatus('Error: ' + err.message);
      });
  };

  const handleCompleteProfile = (e: FormEvent) => {
    e.preventDefault();
    if (!completionName || !completionEmail || !completionPassword || !completionAddress || !completionContactInfo) {
      alert('Full Name, Email, Address, Contact Info, and Password are all required.');
      return;
    }
    setCompletingProfile(true);

    fetch('/api/auth/register-oauth-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: completionName,
        email: completionEmail,
        password: completionPassword,
        location: completionLocation,
        address: completionAddress,
        contactInfo: completionContactInfo
      })
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(data => { throw new Error(data.error || 'Failed to complete profile'); });
        }
        return res.json();
      })
      .then((data: any) => {
        setAuthState(prev => ({
          ...prev,
          profileComplete: true,
          profile: data.profile
        }));
        setCompletingProfile(false);
        fetchUsers();
      })
      .catch(err => {
        console.error(err);
        setCompletingProfile(false);
        alert('Error completing profile: ' + err.message);
      });
  };

  const handleDeleteAccount = () => {
    if (!confirm('Are you absolutely sure you want to permanently delete your account? This action is irreversible.')) {
      return;
    }
    setDeletingAccount(true);
    fetch('/api/users/delete', {
      method: 'POST'
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to delete account');
        return res.json();
      })
      .then(() => {
        setDeletingAccount(false);
        setAuthState({ authenticated: false });
        navigate('/home');
        fetchUsers();
      })
      .catch(err => {
        console.error(err);
        setDeletingAccount(false);
        alert('Error deleting account: ' + err.message);
      });
  };

  const currentFlow = oauthFlows.find(f => f.id === selectedFlowId) || oauthFlows[0];
  const activeStep = currentFlow.steps.find(s => s.id === activeStepId) || currentFlow.steps[0];

  const handleFlowChange = (id: string) => {
    setSelectedFlowId(id);
    setActiveStepId(1);
    setSecuredMessage('');
  };

  const handleNextStep = () => {
    if (activeStepId < currentFlow.steps.length) {
      setActiveStepId(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (activeStepId > 1) {
      setActiveStepId(prev => prev - 1);
    }
  };

  const testSecuredEndpoint = () => {
    fetch('/secured')
      .then(res => res.text())
      .then(text => setSecuredMessage(text))
      .catch(err => setSecuredMessage('Error: ' + err.message));
  };

  // Get x-coordinate for actors in SVG sequence diagram
  const getActorX = (actor: string) => {
    switch (actor) {
      case 'User': return 100;
      case 'Client': return 300;
      case 'AuthServer': return 500;
      case 'ResourceServer': return 700;
      default: return 100;
    }
  };

  const isActorInvolved = (actor: string, flow: OAuthFlow) => {
    return flow.steps.some(s => s.from === actor || s.to === actor);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation Header */}
      <header>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '70px' }}>
          <div onClick={() => navigate('/home')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
            <div style={{ background: 'linear-gradient(135deg, #aa3bff, #00d2ff)', borderRadius: '8px', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={24} style={{ color: 'white' }} />
            </div>
            <div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
                OAuth 2.0 <span className="gradient-text-accent">Interactive Hub</span>
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {loadingAuth ? (
              <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.875rem' }}>Checking session...</span>
            ) : authState.authenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div 
                  onClick={() => navigate('/profile')}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.75rem 0.25rem 0.25rem', borderRadius: '20px', border: '1px solid hsl(var(--border-color))', cursor: 'pointer' }}
                >
                  {authState.avatarUrl ? (
                    <img src={authState.avatarUrl} alt="Avatar" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                  ) : (
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'hsl(var(--accent-primary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <UserIcon size={14} style={{ color: 'white' }} />
                    </div>
                  )}
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{authState.name}</span>
                  <span className="status-dot green" title="Authenticated"></span>
                </div>
                <a href="/logout" className="button-outline" style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.875rem' }}>Logout</a>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button onClick={() => navigate('/home')} className={path === '/home' ? 'button-gradient' : 'button-outline'} style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.875rem' }}>Docs</button>
                <button onClick={() => navigate('/login')} className={path === '/login' ? 'button-gradient' : 'button-outline'} style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.875rem' }}>Login</button>
                <button onClick={() => navigate('/signup')} className={path === '/signup' ? 'button-gradient' : 'button-outline'} style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.875rem' }}>Sign Up</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main style={{ flex: 1, padding: '2.5rem 0' }}>
        <div className="container">
          
          {/* Hero Section */}
          <div style={{ textAlign: 'center', marginBottom: '3.5rem', maxWidth: '800px', marginInline: 'auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(170, 59, 255, 0.08)', border: '1px solid rgba(170, 59, 255, 0.2)', padding: '0.35rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem', color: '#c084fc', marginBottom: '1.25rem' }}>
              <Layers size={14} /> Fully Interactive Learning Environment
            </div>
            <h1 style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '1rem', letterSpacing: '-0.03em' }}>
              Understand <span className="gradient-text-accent">OAuth 2.0</span> Through Visualization
            </h1>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '1.125rem', fontWeight: 400 }}>
              OAuth 2.0 is the industry-standard protocol for authorization. Compare how various flows grant applications secure, scoped access to protected APIs without exposing user credentials.
            </p>
          </div>
          {/* Main Tab Navigation */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
            <button
              onClick={() => navigate('/home')}
              className={path === '/home' ? 'button-gradient' : 'button-outline'}
              style={{ padding: '0.6rem 1.5rem', borderRadius: '30px' }}
            >
              <Layers size={18} style={{ marginRight: '6px' }} />
              OAuth 2.0 Docs & Sandbox
            </button>
            {authState.authenticated ? (
              <button
                onClick={() => navigate('/profile')}
                className={path === '/profile' ? 'button-gradient' : 'button-outline'}
                style={{ padding: '0.6rem 1.5rem', borderRadius: '30px' }}
              >
                <UserIcon size={18} style={{ marginRight: '6px' }} />
                My Profile & Claims
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className={path === '/login' ? 'button-gradient' : 'button-outline'}
                style={{ padding: '0.6rem 1.5rem', borderRadius: '30px' }}
              >
                <Lock size={18} style={{ marginRight: '6px' }} />
                Log In
              </button>
            )}
            <button
              onClick={() => navigate('/signup')}
              className={path === '/signup' ? 'button-gradient' : 'button-outline'}
              style={{ padding: '0.6rem 1.5rem', borderRadius: '30px' }}
            >
              <UserIcon size={18} style={{ marginRight: '6px' }} />
              Sign Up
            </button>
          </div>

          {path === '/home' && (
            <>
              {/* Interactive Documentation Section */}
              <div className="grid-cols-doc" style={{ marginBottom: '4rem' }}>
            
            {/* Left Column: Flow List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h3 style={{ fontSize: '1.125rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                Select OAuth Flow
              </h3>
              
              {oauthFlows.map(flow => {
                const isActive = flow.id === selectedFlowId;
                return (
                  <button
                    key={flow.id}
                    onClick={() => handleFlowChange(flow.id)}
                    className="glass-card"
                    style={{
                      textAlign: 'left',
                      padding: '1.25rem',
                      cursor: 'pointer',
                      borderLeft: isActive ? '4px solid hsl(var(--accent-primary))' : '1px solid hsl(var(--border-color))',
                      background: isActive ? 'rgba(255, 255, 255, 0.03)' : 'rgba(20, 20, 25, 0.4)',
                      transform: isActive ? 'translateX(4px)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 700, color: isActive ? 'white' : 'hsl(var(--text-secondary))' }}>
                        {flow.name}
                      </span>
                      <span 
                        style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 700, 
                          padding: '0.15rem 0.4rem', 
                          borderRadius: '4px',
                          background: flow.securityRating === 'A+' || flow.securityRating === 'A' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: flow.securityRating === 'A+' || flow.securityRating === 'A' ? '#4ade80' : '#f87171'
                        }}
                      >
                        {flow.securityRating}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                      {flow.recommended && (
                        <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.35rem', borderRadius: '4px', background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
                          Recommended
                        </span>
                      )}
                      {flow.deprecated && (
                        <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.35rem', borderRadius: '4px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                          Deprecated
                        </span>
                      )}
                      {!flow.recommended && !flow.deprecated && (
                        <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.35rem', borderRadius: '4px', background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>
                          Legacy
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Column: Flow Display Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Info Header Card */}
              <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>{currentFlow.name}</h2>
                    <p style={{ fontSize: '0.875rem', color: 'hsl(var(--text-muted))' }}>
                      <strong>Target Clients:</strong> {currentFlow.useCase}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {currentFlow.recommended ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', padding: '0.25rem 0.75rem', borderRadius: '9999px', background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>
                        <CheckCircle size={14} /> Highly Secure
                      </span>
                    ) : currentFlow.deprecated ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', padding: '0.25rem 0.75rem', borderRadius: '9999px', background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                        <XCircle size={14} /> Deprecated / Unsafe
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', padding: '0.25rem 0.75rem', borderRadius: '9999px', background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>
                        <Info size={14} /> Use with Caution
                      </span>
                    )}
                  </div>
                </div>
                <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.975rem', borderLeft: '3px solid hsl(var(--border-color))', paddingLeft: '1rem', margin: '0.5rem 0 1rem' }}>
                  {currentFlow.description}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid hsl(var(--border-color))', fontSize: '0.875rem', color: 'hsl(var(--text-muted))' }}>
                  <Info size={16} />
                  <span>{currentFlow.technicalDetails}</span>
                </div>
              </div>

              {/* Dynamic Interactive Diagram Container */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.25rem' }}>Interactive Sequence Diagram</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button onClick={handlePrevStep} disabled={activeStepId === 1} className="button-outline" style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem', opacity: activeStepId === 1 ? 0.4 : 1, cursor: activeStepId === 1 ? 'not-allowed' : 'pointer' }}>
                      <ChevronLeft size={16} /> Prev
                    </button>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'hsl(var(--accent-primary))' }}>
                      Step {activeStepId} of {currentFlow.steps.length}
                    </span>
                    <button onClick={handleNextStep} disabled={activeStepId === currentFlow.steps.length} className="button-outline" style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem', opacity: activeStepId === currentFlow.steps.length ? 0.4 : 1, cursor: activeStepId === currentFlow.steps.length ? 'not-allowed' : 'pointer' }}>
                      Next <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* SVG Visualizer */}
                <div style={{ background: '#0a0a0c', border: '1px solid hsl(var(--border-color))', borderRadius: '12px', overflow: 'hidden', padding: '1.5rem 0' }}>
                  
                  {/* Actor Nodes */}
                  <div style={{ display: 'flex', justifyContent: 'space-around', position: 'relative', marginBottom: '1rem', paddingInline: '20px' }}>
                    
                    {/* User / Resource Owner */}
                    <div className={`actor-node ${!isActorInvolved('User', currentFlow) ? 'disabled' : activeStep.from === 'User' || activeStep.to === 'User' ? 'active' : ''}`} 
                         style={{ opacity: isActorInvolved('User', currentFlow) ? 1 : 0.25, width: '130px' }}>
                      <UserIcon size={18} style={{ color: 'hsl(var(--accent-secondary))', marginBottom: '0.25rem' }} />
                      <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Resource Owner</div>
                      <div style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))' }}>(User / Browser)</div>
                    </div>

                    {/* Client App */}
                    <div className={`actor-node ${!isActorInvolved('Client', currentFlow) ? 'disabled' : activeStep.from === 'Client' || activeStep.to === 'Client' ? 'active' : ''}`}
                         style={{ opacity: isActorInvolved('Client', currentFlow) ? 1 : 0.25, width: '130px' }}>
                      <Cpu size={18} style={{ color: 'hsl(var(--accent-primary))', marginBottom: '0.25rem' }} />
                      <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Client App</div>
                      <div style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))' }}>(Vite React App)</div>
                    </div>

                    {/* Authorization Server */}
                    <div className={`actor-node ${!isActorInvolved('AuthServer', currentFlow) ? 'disabled' : activeStep.from === 'AuthServer' || activeStep.to === 'AuthServer' ? 'active' : ''}`}
                         style={{ opacity: isActorInvolved('AuthServer', currentFlow) ? 1 : 0.25, width: '130px' }}>
                      <Lock size={18} style={{ color: 'hsl(var(--accent-warning))', marginBottom: '0.25rem' }} />
                      <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Auth Server</div>
                      <div style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))' }}>(Google/GitHub)</div>
                    </div>

                    {/* Resource Server */}
                    <div className={`actor-node ${!isActorInvolved('ResourceServer', currentFlow) ? 'disabled' : activeStep.from === 'ResourceServer' || activeStep.to === 'ResourceServer' ? 'active' : ''}`}
                         style={{ opacity: isActorInvolved('ResourceServer', currentFlow) ? 1 : 0.25, width: '130px' }}>
                      <RefreshCw size={18} style={{ color: 'hsl(var(--accent-success))', marginBottom: '0.25rem' }} />
                      <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Resource Server</div>
                      <div style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))' }}>(User Profile API)</div>
                    </div>

                  </div>

                  {/* SVG Lifelines & Arrows */}
                  <div style={{ position: 'relative' }}>
                    <svg viewBox={`0 0 800 ${currentFlow.steps.length * 60 + 20}`} width="100%" height="100%">
                      
                      {/* Vertical Lifelines */}
                      {['User', 'Client', 'AuthServer', 'ResourceServer'].map((actor) => {
                        const x = getActorX(actor);
                        const involved = isActorInvolved(actor, currentFlow);
                        return (
                          <line
                            key={actor}
                            x1={x}
                            y1={0}
                            x2={x}
                            y2={currentFlow.steps.length * 60}
                            stroke="hsl(var(--border-color))"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            opacity={involved ? 0.5 : 0.1}
                          />
                        );
                      })}

                      {/* Horizontal Arrows for each Step */}
                      {currentFlow.steps.map((step, idx) => {
                        const y = (idx + 1) * 60 - 20;
                        const xFrom = getActorX(step.from);
                        const xTo = getActorX(step.to);
                        const isCurrent = step.id === activeStepId;
                        const direction = xTo > xFrom ? 1 : -1;

                        // Create marker arrow heads
                        return (
                          <g key={step.id} style={{ cursor: 'pointer' }} onClick={() => setActiveStepId(step.id)}>
                            
                            {/* Hotspot box for clicking */}
                            <rect
                              x={Math.min(xFrom, xTo) - 10}
                              y={y - 20}
                              width={Math.abs(xTo - xFrom) + 20}
                              height={40}
                              fill="transparent"
                            />

                            {/* Arrow Line */}
                            <line
                              x1={xFrom}
                              y1={y}
                              x2={xTo - (10 * direction)}
                              y2={y}
                              stroke={isCurrent ? 'hsl(var(--accent-primary))' : 'rgba(255,255,255,0.15)'}
                              strokeWidth={isCurrent ? 3 : 1.5}
                              className={isCurrent ? 'pulsate-glow' : ''}
                            />

                            {/* Arrow Head */}
                            <polygon
                              points={
                                direction > 0 
                                  ? `${xTo-10},${y-5} ${xTo},${y} ${xTo-10},${y+5}` 
                                  : `${xTo+10},${y-5} ${xTo},${y} ${xTo+10},${y+5}`
                              }
                              fill={isCurrent ? 'hsl(var(--accent-primary))' : 'rgba(255,255,255,0.25)'}
                            />

                            {/* Step Text Indicator */}
                            <text
                              x={(xFrom + xTo) / 2}
                              y={y - 8}
                              textAnchor="middle"
                              fill={isCurrent ? '#c084fc' : 'hsl(var(--text-secondary))'}
                              fontSize={11}
                              fontWeight={isCurrent ? 700 : 500}
                              fontFamily="var(--font-heading)"
                            >
                              {step.label}
                            </text>

                            {/* Animated Traveling Pulse Dot */}
                            {isCurrent && (
                              <circle r="5" fill="hsl(var(--accent-secondary))">
                                <animate
                                  attributeName="cx"
                                  from={xFrom}
                                  to={xTo}
                                  dur="1.5s"
                                  repeatCount="indefinite"
                                />
                                <animate
                                  attributeName="cy"
                                  values={`${y}`}
                                  dur="1.5s"
                                  repeatCount="indefinite"
                                />
                              </circle>
                            )}

                          </g>
                        );
                      })}
                    </svg>
                  </div>

                </div>

                {/* Step Detail Explanation Pane */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid hsl(var(--border-color))', borderRadius: '12px', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ background: 'hsl(var(--accent-primary) / 0.15)', color: '#c084fc', border: '1px solid hsl(var(--accent-primary) / 0.3)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                      Step {activeStep.id}
                    </span>
                    <strong style={{ fontSize: '0.95rem' }}>{activeStep.label}</strong>
                  </div>
                  <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                    {activeStep.description}
                  </p>
                  <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <Info size={14} style={{ flexShrink: 0, marginTop: '2px', color: 'hsl(var(--accent-secondary))' }} />
                    <span>{activeStep.details}</span>
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* Sandbox Session Demo Block */}
          <section id="sandbox" className="glass-card" style={{ marginTop: '2rem', padding: '2rem' }}>
            <div style={{ borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '1rem', marginBottom: '2rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--accent-success))', background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                <CheckCircle size={12} /> Sandbox Interactive Gateway
              </div>
              <h2 style={{ fontSize: '1.85rem' }}>Live OAuth 2.0 Client Sandbox</h2>
              <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.975rem', maxWidth: '700px', marginInline: 'auto' }}>
                This Spring Boot application is configured as an **OAuth 2.0 Client** using Spring Security. Log in with Google or GitHub to witness the flow complete in real-time.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: '2rem', textAlign: 'left' }}>
              
              {/* Left Sandbox Column: Action Panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem' }}>Authentication Controls</h3>
                
                {loadingAuth ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '150px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <RefreshCw size={24} className="pulsate-glow animate-dash" style={{ animation: 'spin 2s linear infinite' }} />
                      <p style={{ fontSize: '0.875rem', color: 'hsl(var(--text-muted))', marginTop: '0.5rem' }}>Verifying active session...</p>
                    </div>
                  </div>
                ) : authState.authenticated ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    
                    {/* Logged in success dashboard */}
                    <div style={{ background: 'rgba(34, 197, 94, 0.03)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '12px', padding: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        {authState.avatarUrl ? (
                          <img src={authState.avatarUrl} alt="User Avatar" style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid #4ade80' }} />
                        ) : (
                          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'hsl(var(--accent-primary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <UserIcon size={24} style={{ color: 'white' }} />
                          </div>
                        )}
                        <div>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{authState.name}</h4>
                          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', textTransform: 'capitalize' }}>
                            Logged in via <strong>{authState.provider}</strong>
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#0a0a0c', padding: '0.75rem', borderRadius: '8px', border: '1px solid hsl(var(--border-color))', fontSize: '0.8rem' }}>
                        <div><strong>Email:</strong> {authState.email || 'N/A (Hidden or Not Provided)'}</div>
                        <div><strong>Auth Flow Used:</strong> Authorization Code Flow (Server-side)</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <button onClick={testSecuredEndpoint} className="button-gradient" style={{ justifyContent: 'center' }}>
                        Test Protected Resource (/secured)
                      </button>
                      <a href="/logout" className="button-outline" style={{ justifyContent: 'center' }}>
                        Log Out of System
                      </a>
                    </div>

                    {securedMessage && (
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid hsl(var(--border-color))', borderRadius: '8px', padding: '0.75rem', fontSize: '0.85rem' }}>
                        <span style={{ color: 'hsl(var(--accent-success))', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Server Response:</span>
                        <code>{securedMessage}</code>
                      </div>
                    )}

                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <p style={{ fontSize: '0.875rem', color: 'hsl(var(--text-secondary))' }}>
                      You are currently unauthenticated. Click one of the secure authentication providers below. The backend server will initiate the **Authorization Code Flow** with the respective developer console.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                      
                      {/* Google Button */}
                      <a href="/oauth2/authorization/google" className="button-outline" style={{ justifyContent: 'center', background: '#ffffff', color: '#1f2937', fontWeight: 600 }}>
                        <svg viewBox="0 0 24 24" width="16" height="16" style={{ marginRight: '4px' }}>
                          <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.58 14.99 1 12 1 7.24 1 3.2 3.74 1.25 7.74l3.86 3C6.01 7.72 8.78 5.04 12 5.04z"/>
                          <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.44c-.28 1.47-1.11 2.72-2.36 3.56l3.67 2.84c2.14-1.98 3.74-4.88 3.74-8.5z"/>
                          <path fill="#FBBC05" d="M5.11 10.74c-.24.72-.37 1.49-.37 2.26s.13 1.54.37 2.26l-3.86 3C.47 16.52 0 14.81 0 13s.47-3.52 1.25-5.26l3.86 3z"/>
                          <path fill="#34A853" d="M12 18.96c-3.22 0-5.99-2.68-6.89-5.7l-3.86 3C3.2 20.26 7.24 23 12 23c3.08 0 5.86-1.01 7.82-2.77l-3.67-2.84c-1.14.77-2.6 1.57-4.15 1.57z"/>
                        </svg>
                        Log in with Google
                      </a>

                      {/* GitHub Button */}
                      <a href="/oauth2/authorization/github" className="button-outline" style={{ justifyContent: 'center', background: '#24292e', color: '#ffffff', borderColor: '#24292e' }}>
                        <GithubIcon size={16} />
                        Log in with GitHub
                      </a>

                    </div>
                  </div>
                )}

              </div>

              {/* Right Sandbox Column: System Flow Diagram */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '1px solid hsl(var(--border-color))', paddingLeft: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem' }}>System Flow Analysis</h3>
                <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))' }}>
                  Behind the scenes, here is the architecture operating inside this application:
                </p>

                <div style={{ background: '#0a0a0c', border: '1px solid hsl(var(--border-color))', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div style={{ background: 'hsl(var(--accent-primary) / 0.1)', color: '#c084fc', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>1</div>
                    <div>
                      <strong>Redirecting:</strong> When clicking "Log in", the client triggers a redirect to Spring Boot's internal authentication route: <code>/oauth2/authorization/[provider]</code>.
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div style={{ background: 'hsl(var(--accent-primary) / 0.1)', color: '#c084fc', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>2</div>
                    <div>
                      <strong>Handshake:</strong> Spring Security delegates the redirect to Google/GitHub. The User logs in and approves consent.
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div style={{ background: 'hsl(var(--accent-primary) / 0.1)', color: '#c084fc', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>3</div>
                    <div>
                      <strong>Code Exchange:</strong> Google/GitHub redirects back to <code>/login/oauth2/code/[provider]</code> with an auth code. The backend exchanges this code for an access token via a back-channel request.
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div style={{ background: 'hsl(var(--accent-primary) / 0.1)', color: '#c084fc', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>4</div>
                    <div>
                      <strong>Establishment:</strong> The server obtains details (username, profile image) and creates a Spring Security session context, redirecting you back to <code>/</code>.
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </section>

          {/* Users Directory View embedded in Docs Home page */}
          <div style={{ marginTop: '4rem', textAlign: 'left' }}>
            <div className="glass-card" style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Registered Users Directory</h2>
              <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.975rem' }}>
                A directory of users fetched directly from your local MySQL database. Log in to register your account!
              </p>
            </div>

            {loadingUsers ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '150px' }}>
                <RefreshCw size={24} className="pulsate-glow animate-dash" style={{ animation: 'spin 2s linear infinite' }} />
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {usersList.length === 0 ? (
                  <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'hsl(var(--text-muted))' }}>
                    No users registered in the MySQL database yet. Be the first!
                  </div>
                ) : (
                  usersList.map((user) => (
                    <div key={user.id + '_' + user.provider} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.name} style={{ width: '56px', height: '56px', borderRadius: '50%', border: '2px solid hsl(var(--accent-primary) / 0.5)' }} />
                        ) : (
                          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'hsl(var(--accent-primary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <UserIcon size={24} style={{ color: 'white' }} />
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</h4>
                          <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email || 'No public email'}</div>
                        </div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.4rem', borderRadius: '4px', background: user.provider === 'github' ? '#24292e' : 'rgba(255,255,255,0.05)', color: '#ffffff', border: '1px solid hsl(var(--border-color))', textTransform: 'capitalize' }}>
                          {user.provider}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#0a0a0c', padding: '0.75rem', borderRadius: '8px', border: '1px solid hsl(var(--border-color))', fontSize: '0.85rem' }}>
                        <div><span style={{ color: 'hsl(var(--text-muted))', width: '70px', display: 'inline-block' }}>📍 Location:</span> <span style={{ color: 'white', fontWeight: 500 }}>{user.location}</span></div>
                        <div><span style={{ color: 'hsl(var(--text-muted))', width: '70px', display: 'inline-block' }}>🏠 Address:</span> <span style={{ color: 'white', fontWeight: 500 }}>{user.address}</span></div>
                        <div><span style={{ color: 'hsl(var(--text-muted))', width: '70px', display: 'inline-block' }}>📞 Contact:</span> <span style={{ color: 'white', fontWeight: 500 }}>{user.contactInfo}</span></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          </>
          )}

          {/* Profile View */}
          {path === '/profile' && authState.authenticated && (
            <div className="grid-cols-doc" style={{ animation: 'fadeIn 0.3s ease-in-out', textAlign: 'left' }}>
              {/* Profile Left Card */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.5rem', padding: '2.5rem 2rem' }}>
                <div style={{ position: 'relative' }}>
                  {authState.avatarUrl ? (
                    <img 
                      src={authState.avatarUrl} 
                      alt="Avatar" 
                      style={{ 
                        width: '120px', 
                        height: '120px', 
                        borderRadius: '50%', 
                        border: '3px solid hsl(var(--accent-primary))',
                        boxShadow: '0 0 20px hsl(var(--accent-primary) / 0.3)'
                      }} 
                    />
                  ) : (
                    <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'hsl(var(--accent-primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px hsl(var(--accent-primary) / 0.3)' }}>
                      <UserIcon size={48} style={{ color: 'white' }} />
                    </div>
                  )}
                  <span className="status-dot green" style={{ position: 'absolute', bottom: '5px', right: '5px', width: '16px', height: '16px', border: '3px solid hsl(var(--bg-secondary))' }} title="Session Active"></span>
                </div>

                <div>
                  <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>{authState.name}</h2>
                  <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    {authState.email || 'No email provided'}
                  </p>
                  
                  {/* Provider Badge */}
                  <span style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.4rem', 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '9999px',
                    background: authState.provider === 'github' ? '#24292e' : 'rgba(255,255,255,0.05)',
                    color: '#ffffff',
                    border: '1px solid hsl(var(--border-color))'
                  }}>
                    {authState.provider === 'github' ? <GithubIcon size={12} /> : (
                      <svg viewBox="0 0 24 24" width="12" height="12">
                        <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.58 14.99 1 12 1 7.24 1 3.2 3.74 1.25 7.74l3.86 3C6.01 7.72 8.78 5.04 12 5.04z"/>
                        <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.44c-.28 1.47-1.11 2.72-2.36 3.56l3.67 2.84c2.14-1.98 3.74-4.88 3.74-8.5z"/>
                        <path fill="#FBBC05" d="M5.11 10.74c-.24.72-.37 1.49-.37 2.26s.13 1.54.37 2.26l-3.86 3C.47 16.52 0 14.81 0 13s.47-3.52 1.25-5.26l3.86 3z"/>
                        <path fill="#34A853" d="M12 18.96c-3.22 0-5.99-2.68-6.89-5.7l-3.86 3C3.2 20.26 7.24 23 12 23c3.08 0 5.86-1.01 7.82-2.77l-3.67-2.84c-1.14.77-2.6 1.57-4.15 1.57z"/>
                      </svg>
                    )}
                    Authenticated via {authState.provider === 'github' ? 'GitHub' : 'Google'}
                  </span>
                </div>

                <div style={{ width: '100%', borderTop: '1px solid hsl(var(--border-color))', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', textAlign: 'left' }}>
                  <div>
                    <strong style={{ color: 'hsl(var(--text-muted))' }}>📍 Location:</strong>
                    <div style={{ marginTop: '0.15rem', fontWeight: 500 }}>{authState.profile?.location || 'Not specified'}</div>
                  </div>
                  <div>
                    <strong style={{ color: 'hsl(var(--text-muted))' }}>🏠 Address:</strong>
                    <div style={{ marginTop: '0.15rem', fontWeight: 500 }}>{authState.profile?.address || 'Not specified'}</div>
                  </div>
                  <div>
                    <strong style={{ color: 'hsl(var(--text-muted))' }}>📞 Contact Info:</strong>
                    <div style={{ marginTop: '0.15rem', fontWeight: 500 }}>{authState.profile?.contactInfo || 'Not specified'}</div>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
                    <strong style={{ color: 'hsl(var(--text-muted))' }}>Account Subject ID:</strong>
                    <code style={{ display: 'block', wordBreak: 'break-all', marginTop: '0.25rem', background: '#0a0a0c', padding: '0.4rem', borderRadius: '4px' }}>
                      {authState.attributes?.sub || authState.attributes?.id || 'N/A'}
                    </code>
                  </div>
                </div>

                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                  <button onClick={testSecuredEndpoint} className="button-gradient" style={{ justifyContent: 'center', width: '100%' }}>
                    Verify Secure Endpoint (/secured)
                  </button>
                  <a href="/logout" className="button-outline" style={{ justifyContent: 'center', width: '100%' }}>
                    Sign Out
                  </a>
                  {securedMessage && (
                    <div style={{ background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '8px', padding: '0.75rem', fontSize: '0.8rem', textAlign: 'left' }}>
                      <strong>Response:</strong> <code>{securedMessage}</code>
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Right Card */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  {/* Tabs */}
                  <div style={{ display: 'flex', borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '0.5rem', gap: '1.5rem' }}>
                    <button 
                      onClick={() => setProfileSubTab('edit')} 
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        borderBottom: profileSubTab === 'edit' ? '2px solid hsl(var(--accent-primary))' : '2px solid transparent',
                        color: profileSubTab === 'edit' ? 'white' : 'hsl(var(--text-muted))',
                        fontWeight: 600,
                        paddingBottom: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.95rem'
                      }}
                    >
                      Edit Profile Info
                    </button>
                    <button 
                      onClick={() => setProfileSubTab('claims')} 
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        borderBottom: profileSubTab === 'claims' ? '2px solid hsl(var(--accent-primary))' : '2px solid transparent',
                        color: profileSubTab === 'claims' ? 'white' : 'hsl(var(--text-muted))',
                        fontWeight: 600,
                        paddingBottom: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.95rem'
                      }}
                    >
                      Raw Claims Data (ID Token)
                    </button>
                    <button 
                      onClick={() => setProfileSubTab('scopes')} 
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        borderBottom: profileSubTab === 'scopes' ? '2px solid hsl(var(--accent-primary))' : '2px solid transparent',
                        color: profileSubTab === 'scopes' ? 'white' : 'hsl(var(--text-muted))',
                        fontWeight: 600,
                        paddingBottom: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.95rem'
                      }}
                    >
                      Spring Security Context
                    </button>
                    <button 
                      onClick={() => setProfileSubTab('delete')} 
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        borderBottom: profileSubTab === 'delete' ? '2px solid #ef4444' : '2px solid transparent',
                        color: profileSubTab === 'delete' ? '#ef4444' : 'hsl(var(--text-muted))',
                        fontWeight: 600,
                        paddingBottom: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.95rem'
                      }}
                    >
                      Delete Account
                    </button>
                  </div>

                  {profileSubTab === 'edit' && (
                    <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
                      <p style={{ fontSize: '0.875rem', color: 'hsl(var(--text-secondary))' }}>
                        Provide your location, physical address, and contact number. This information will be saved to the database registry and displayed in the public directory.
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>Location</label>
                        <input 
                          type="text" 
                          value={editLocation} 
                          onChange={(e) => setEditLocation(e.target.value)}
                          placeholder="e.g. San Francisco, CA"
                          style={{ background: '#0a0a0c', border: '1px solid hsl(var(--border-color))', borderRadius: '6px', padding: '0.6rem 0.8rem', color: 'white', fontSize: '0.9rem' }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>Physical Address</label>
                        <input 
                          type="text" 
                          value={editAddress} 
                          onChange={(e) => setEditAddress(e.target.value)}
                          placeholder="e.g. 123 Main St, Suite 100"
                          style={{ background: '#0a0a0c', border: '1px solid hsl(var(--border-color))', borderRadius: '6px', padding: '0.6rem 0.8rem', color: 'white', fontSize: '0.9rem' }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>Contact Number / Info</label>
                        <input 
                          type="text" 
                          value={editContactInfo} 
                          onChange={(e) => setEditContactInfo(e.target.value)}
                          placeholder="e.g. +1 (555) 019-2834"
                          style={{ background: '#0a0a0c', border: '1px solid hsl(var(--border-color))', borderRadius: '6px', padding: '0.6rem 0.8rem', color: 'white', fontSize: '0.9rem' }}
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                        <button type="submit" disabled={savingProfile} className="button-gradient" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}>
                          {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                        </button>
                        {saveStatus && (
                          <span style={{ fontSize: '0.85rem', color: saveStatus.startsWith('Error') ? '#f87171' : '#4ade80', fontWeight: 500 }}>
                            {saveStatus}
                          </span>
                        )}
                      </div>
                    </form>
                  )}

                  {profileSubTab === 'claims' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <p style={{ fontSize: '0.875rem', color: 'hsl(var(--text-secondary))' }}>
                        This is the raw payload decoded from the Identity/Access claims returned by the OAuth Provider. These claims describe user metadata attributes.
                      </p>
                      <pre style={{ margin: 0, maxHeight: '400px', overflowY: 'auto' }}>
                        {JSON.stringify(authState.attributes || {}, null, 2)}
                      </pre>
                    </div>
                  )}

                  {profileSubTab === 'scopes' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
                      <div>
                        <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Granted Authorities</h4>
                        <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', marginBottom: '0.75rem' }}>
                          Spring Security maps the OAuth 2.0 user scopes into standard granted authorities. These are evaluated by security expressions (like <code>hasAuthority()</code>) to restrict endpoint access.
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {authState.authorities?.map((auth) => (
                            <span key={auth} style={{ fontSize: '0.75rem', background: 'rgba(170, 59, 255, 0.1)', color: '#c084fc', border: '1px solid rgba(170, 59, 255, 0.2)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                              {auth}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid hsl(var(--border-color))', paddingTop: '1.25rem' }}>
                        <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Scope Delegation Mapping</h4>
                        <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))' }}>
                          During the redirect handshake, the client requested the default scopes:
                        </p>
                        <ul style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', paddingLeft: '1.25rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <li><code>openid</code>: Establishes identity protocol (OIDC) to retrieve user details.</li>
                          <li><code>profile</code>: Requests general descriptive attributes (name, avatar picture).</li>
                          <li><code>email</code>: Requests primary account email verification data.</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {profileSubTab === 'delete' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
                      <h4 style={{ fontSize: '1.1rem', color: '#ef4444' }}>Danger Zone</h4>
                      <p style={{ fontSize: '0.875rem', color: 'hsl(var(--text-secondary))' }}>
                        Deleting your account will permanently remove all your profile data (name, address, location, contact info) from our MySQL database registry. This action cannot be undone.
                      </p>
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                        <button 
                          onClick={handleDeleteAccount} 
                          disabled={deletingAccount} 
                          className="button-outline" 
                          style={{ borderColor: '#ef4444', color: '#ef4444', background: 'rgba(239, 68, 68, 0.05)', padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}
                        >
                          {deletingAccount ? 'Deleting Account...' : 'Permanently Delete My Account'}
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          )}

          {/* Login View */}
          {path === '/login' && (
            <div style={{ maxWidth: '480px', margin: '4rem auto', animation: 'fadeIn 0.3s ease-in-out', textAlign: 'left' }}>
              <div className="glass-card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'inline-flex', background: 'linear-gradient(135deg, #aa3bff, #00d2ff)', borderRadius: '12px', padding: '0.75rem', marginBottom: '1rem' }}>
                    <Lock size={32} style={{ color: 'white' }} />
                  </div>
                  <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Secure Sign In</h2>
                  <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem' }}>
                    Authenticate using a secure identity provider.
                  </p>
                </div>

                {authError && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem', borderRadius: '6px', color: '#f87171', fontSize: '0.85rem' }}>
                    {authError}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {/* Google Button */}
                  <a href="/oauth2/authorization/google" className="button-outline" style={{ justifyContent: 'center', background: '#ffffff', color: '#1f2937', fontWeight: 600 }}>
                    <svg viewBox="0 0 24 24" width="16" height="16" style={{ marginRight: '8px' }}>
                      <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.58 14.99 1 12 1 7.24 1 3.2 3.74 1.25 7.74l3.86 3C6.01 7.72 8.78 5.04 12 5.04z"/>
                      <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.44c-.28 1.47-1.11 2.72-2.36 3.56l3.67 2.84c2.14-1.98 3.74-4.88 3.74-8.5z"/>
                      <path fill="#FBBC05" d="M5.11 10.74c-.24.72-.37 1.49-.37 2.26s.13 1.54.37 2.26l-3.86 3C.47 16.52 0 14.81 0 13s.47-3.52 1.25-5.26l3.86 3z"/>
                      <path fill="#34A853" d="M12 18.96c-3.22 0-5.99-2.68-6.89-5.7l-3.86 3C3.2 20.26 7.24 23 12 23c3.08 0 5.86-1.01 7.82-2.77l-3.67-2.84c-1.14.77-2.6 1.57-4.15 1.57z"/>
                    </svg>
                    Sign In with Google
                  </a>

                  {/* GitHub Button */}
                  <a href="/oauth2/authorization/github" className="button-outline" style={{ justifyContent: 'center', background: '#24292e', color: '#ffffff', borderColor: '#24292e' }}>
                    <GithubIcon size={16} style={{ marginRight: '8px' }} />
                    Sign In with GitHub
                  </a>
                </div>

                <div style={{ borderTop: '1px solid hsl(var(--border-color))', paddingTop: '1.25rem', fontSize: '0.8rem', color: 'hsl(var(--text-muted))', display: 'flex', gap: '0.5rem' }}>
                  <Info size={16} style={{ flexShrink: 0, color: 'hsl(var(--accent-secondary))' }} />
                  <span>
                    No passwords are saved on our servers for Google/GitHub access. Password creation will be prompted upon first login.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Signup View */}
          {path === '/signup' && (
            <div style={{ maxWidth: '480px', margin: '4rem auto', animation: 'fadeIn 0.3s ease-in-out', textAlign: 'left' }}>
              <div className="glass-card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'inline-flex', background: 'linear-gradient(135deg, #00d2ff, #22c55e)', borderRadius: '12px', padding: '0.75rem', marginBottom: '1rem' }}>
                    <UserIcon size={32} style={{ color: 'white' }} />
                  </div>
                  <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>OAuth 2.0 Account Creation</h2>
                  <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem' }}>
                    Register instantly using Google or GitHub.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <a href="/oauth2/authorization/google" className="button-gradient" style={{ justifyContent: 'center' }}>
                    Register with Google Account
                  </a>
                  <a href="/oauth2/authorization/github" className="button-outline" style={{ justifyContent: 'center' }}>
                    Register with GitHub Account
                  </a>
                </div>

                <div style={{ borderTop: '1px solid hsl(var(--border-color))', paddingTop: '1.25rem', fontSize: '0.8rem', color: 'hsl(var(--text-muted))', display: 'flex', gap: '0.5rem' }}>
                  <Info size={16} style={{ flexShrink: 0, color: 'hsl(var(--accent-secondary))' }} />
                  <span>
                    MySQL database profiles are created after authenticating and completing the profile settings form.
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid hsl(var(--border-color))', padding: '1.5rem 0', background: 'hsl(var(--bg-secondary))', textAlign: 'center', fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>
        <div className="container">
          <p>© {new Date().getFullYear()} Spring Boot & React OAuth 2.0 Education Platform. Made with ♥ for developers.</p>
        </div>
      </footer>

      {/* Profile Completion Modal Overlay */}
      {authState.authenticated && !authState.profileComplete && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 5, 8, 0.9)',
          backdropFilter: 'blur(12px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div className="glass-card" style={{ maxWidth: '500px', width: '100%', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', background: 'linear-gradient(135deg, #aa3bff, #00d2ff)', borderRadius: '12px', padding: '0.75rem', marginBottom: '1rem' }}>
                <UserIcon size={32} style={{ color: 'white' }} />
              </div>
              <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Create Your Local Credentials</h2>
              <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem' }}>
                Please complete the form to create your account in the system database.
              </p>
            </div>

            <form onSubmit={handleCompleteProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>Address *</label>
                <input 
                  type="text" 
                  required
                  value={completionAddress} 
                  onChange={(e) => setCompletionAddress(e.target.value)}
                  placeholder="Street, City, Zip"
                  style={{ background: '#0a0a0c', border: '1px solid hsl(var(--border-color))', borderRadius: '6px', padding: '0.6rem 0.8rem', color: 'white', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>Contact Info *</label>
                <input 
                  type="text" 
                  required
                  value={completionContactInfo} 
                  onChange={(e) => setCompletionContactInfo(e.target.value)}
                  placeholder="Phone number / Contact email"
                  style={{ background: '#0a0a0c', border: '1px solid hsl(var(--border-color))', borderRadius: '6px', padding: '0.6rem 0.8rem', color: 'white', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>Password *</label>
                <input 
                  type="password" 
                  required
                  value={completionPassword} 
                  onChange={(e) => setCompletionPassword(e.target.value)}
                  placeholder="Create password (minimum 6 chars)"
                  style={{ background: '#0a0a0c', border: '1px solid hsl(var(--border-color))', borderRadius: '6px', padding: '0.6rem 0.8rem', color: 'white', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>Full Name *</label>
                <input 
                  type="text" 
                  required
                  value={completionName} 
                  onChange={(e) => setCompletionName(e.target.value)}
                  placeholder="John Doe"
                  style={{ background: '#0a0a0c', border: '1px solid hsl(var(--border-color))', borderRadius: '6px', padding: '0.6rem 0.8rem', color: 'white', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>Email Address *</label>
                <input 
                  type="email" 
                  required
                  disabled={!!authState.email}
                  value={completionEmail} 
                  onChange={(e) => setCompletionEmail(e.target.value)}
                  style={{ 
                    background: authState.email ? '#111115' : '#0a0a0c', 
                    border: '1px solid hsl(var(--border-color))', 
                    borderRadius: '6px', 
                    padding: '0.6rem 0.8rem', 
                    color: authState.email ? 'hsl(var(--text-muted))' : 'white', 
                    fontSize: '0.9rem', 
                    cursor: authState.email ? 'not-allowed' : 'text' 
                  }}
                />
              </div>

              <button type="submit" disabled={completingProfile} className="button-gradient" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', marginTop: '0.5rem' }}>
                {completingProfile ? 'Creating Profile...' : 'Create Account & Log In'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
