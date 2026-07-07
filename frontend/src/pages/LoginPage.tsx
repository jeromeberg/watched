import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthForm } from '../components/AuthForm';
import { textClasses } from '../components/Text';

export function LoginPage() {
  const { login } = useAuth();

  return (
    <AuthForm
      heading="Sign in"
      passwordAutoComplete="current-password"
      submitLabel="Sign in"
      loadingLabel="Signing in..."
      errorFallback="Login failed"
      onSubmit={login}
      footer={
        <>
          No account?{' '}
          <Link to="/register" className={textClasses('link', 'sm', 'accent')}>
            Register
          </Link>
        </>
      }
    />
  );
}
