import { useState, SubmitEvent, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/client';
import { Text } from './Text';
import { Input } from './Input';
import { Button } from './Button';
import { ErrorMessage } from './ErrorMessage';

interface AuthFormProps {
  heading: string;
  passwordAutoComplete: 'current-password' | 'new-password';
  submitLabel: string;
  loadingLabel: string;
  errorFallback: string;
  onSubmit: (username: string, password: string) => Promise<void>;
  footer: ReactNode;
}

export function AuthForm({
  heading,
  passwordAutoComplete,
  submitLabel,
  loadingLabel,
  errorFallback,
  onSubmit,
  footer,
}: AuthFormProps) {
  const navigate = useNavigate();
  const { demoLogin } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSubmit(username, password);
      navigate('/movies');
    } catch (err) {
      setError(err instanceof Error ? err.message : errorFallback);
    } finally {
      setLoading(false);
    }
  }

  async function handleDemo() {
    setError('');
    setDemoLoading(true);
    try {
      await demoLogin();
      navigate('/movies');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not start the demo'));
    } finally {
      setDemoLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Text as="h1" variant="heading" size="3xl" className="text-center mb-8 tracking-tight">
          Watched
        </Text>
        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl p-8 space-y-5">
          <Text as="h2" variant="heading" size="lg">
            {heading}
          </Text>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <div className="space-y-1">
            <Text as="label" variant="label" className="block">
              Username
            </Text>
            <Input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Text as="label" variant="label" className="block">
              Password
            </Text>
            <Input
              type="password"
              autoComplete={passwordAutoComplete}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" variant="primary" disabled={loading || demoLoading} className="w-full py-2.5">
            {loading ? loadingLabel : submitLabel}
          </Button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--color-border)]" />
            <Text size="xs" color="subtle">
              or
            </Text>
            <div className="h-px flex-1 bg-[var(--color-border)]" />
          </div>

          <Button
            type="button"
            variant="secondary"
            disabled={loading || demoLoading}
            className="w-full py-2.5"
            onClick={handleDemo}
          >
            {demoLoading ? 'Starting demo...' : 'Demo'}
          </Button>

          <Text className="text-center">{footer}</Text>
        </form>
      </div>
    </div>
  );
}
