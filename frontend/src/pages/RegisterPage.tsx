import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthForm } from '../components/AuthForm';
import { textClasses } from '../components/Text';

export function RegisterPage() {
  const { register } = useAuth();

  return (
    <AuthForm
      heading="Create account"
      passwordAutoComplete="new-password"
      submitLabel="Create account"
      loadingLabel="Creating account..."
      errorFallback="Registration failed"
      onSubmit={register}
      footer={
        <>
          Have an account?{' '}
          <Link to="/login" className={textClasses('link', 'sm', 'accent')}>
            Sign in
          </Link>
        </>
      }
    />
  );
}
