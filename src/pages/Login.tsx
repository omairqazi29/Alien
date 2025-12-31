import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Mail, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input, Alert, Card } from '../components/ui';

export function Login() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password);
        setMessage('Check your email for the confirmation link!');
      } else {
        await signIn(email, password);
        navigate('/');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-500/20 rounded-xl mb-4">
            <Rocket className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">The Alien Project</h1>
          <p className="text-gray-400 mt-2">EB-1A Preparation Dashboard</p>
        </div>

        {/* Form Card */}
        <Card padding="lg">
          <h2 className="text-xl font-semibold text-white mb-6">
            {isSignUp ? 'Create an account' : 'Welcome back'}
          </h2>

          {error && (
            <Alert variant="error" className="mb-4">
              {error}
            </Alert>
          )}

          {message && (
            <Alert variant="success" className="mb-4">
              {message}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              icon={<Mail className="w-5 h-5" />}
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={<Lock className="w-5 h-5" />}
              required
              minLength={6}
            />

            <Button type="submit" loading={loading} className="w-full">
              {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={toggleMode}
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
