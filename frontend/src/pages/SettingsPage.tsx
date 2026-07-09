import { useState, SubmitEvent } from 'react';
import { Layout } from '../components/Layout';
import { Text } from '../components/Text';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ErrorMessage } from '../components/ErrorMessage';
import { Container } from '../components/Container';
import { api } from '../api/client';

export function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

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
        <Container variant="danger" label="⚠️ Danger zone" className="flex items-center justify-between gap-4">
          <Text color="muted">Permanently delete your account and data.</Text>
          <Button variant="danger" disabled title="Coming soon">
            Delete account
          </Button>
        </Container>
      </div>
    </Layout>
  );
}
