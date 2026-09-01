import { useEffect, useState, SubmitEvent } from 'react';
import { Layout } from '../components/Layout';
import { Text } from '../components/Text';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ErrorMessage } from '../components/ErrorMessage';
import { Container } from '../components/Container';
import { VisibilityControl } from '../components/VisibilityControl';
import { api, getErrorMessage, isAbortError } from '../api/client';
import { Visibility } from '../types';

export function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [visibility, setVisibility] = useState<Visibility | null>(null);
  const [visibilityError, setVisibilityError] = useState('');
  const [savingVisibility, setSavingVisibility] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    api
      .get<{ visibility: Visibility }>('/me/settings', { signal: controller.signal })
      .then((settings) => {
        if (!controller.signal.aborted) setVisibility(settings.visibility);
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted || isAbortError(requestError)) return;
        setVisibilityError(getErrorMessage(requestError, 'Could not load visibility'));
      });
    return () => controller.abort();
  }, []);

  /** Persist the visibility applied to the user's library and collections. */
  async function handleVisibilityChange(nextVisibility: Visibility) {
    if (!visibility || nextVisibility === visibility || savingVisibility) return;
    setSavingVisibility(true);
    setVisibilityError('');
    try {
      const settings = await api.patch<{ visibility: Visibility }>('/me/settings', {
        visibility: nextVisibility,
      });
      setVisibility(settings.visibility);
    } catch (requestError) {
      setVisibilityError(getErrorMessage(requestError, 'Could not update visibility'));
    } finally {
      setSavingVisibility(false);
    }
  }

  async function handleChangePassword(e: SubmitEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setSaving(true);
    try {
      await api.patch('/me/password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <div className="max-w-lg mx-auto space-y-10">
        <Text as="h1" variant="heading" size="2xl">
          Settings
        </Text>

        <Container>
          {visibility ? (
            <VisibilityControl
              value={visibility}
              onChange={handleVisibilityChange}
              saving={savingVisibility}
              error={visibilityError}
              description="Private hides your entire library and all collections from other users. Individual choices are preserved."
            />
          ) : visibilityError ? (
            <ErrorMessage>{visibilityError}</ErrorMessage>
          ) : (
            <Text color="subtle">Loading...</Text>
          )}
        </Container>

        {/* Change password */}
        <Container as="form" label="Change password" onSubmit={handleChangePassword} className="space-y-4">
          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && <Text color="success">Password changed.</Text>}
          <div className="space-y-1">
            <Text as="label" variant="label" className="block">
              Current password
            </Text>
            <Input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Text as="label" variant="label" className="block">
              New password
            </Text>
            <Input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Text as="label" variant="label" className="block">
              Confirm new password
            </Text>
            <Input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving...' : 'Change password'}
          </Button>
        </Container>

        {/* Export */}
        <Container label="Export" className="flex items-center justify-between gap-4">
          <Text color="muted">Download a copy of your data.</Text>
          <Button variant="secondary" disabled title="Coming soon">
            Export data
          </Button>
        </Container>

        {/* Delete account */}
        <Container
          variant="danger"
          label="⚠️ Danger zone"
          className="flex items-center justify-between gap-4"
        >
          <Text color="muted">Permanently delete your account and data.</Text>
          <Button variant="danger" disabled title="Coming soon">
            Delete account
          </Button>
        </Container>
      </div>
    </Layout>
  );
}
