import { useState } from 'react';
import { X, Mail, Trash2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Calendar } from '../../types/database';
import { useSharing } from '../../hooks/useSharing';

interface ShareCalendarModalProps {
  open: boolean;
  onClose: () => void;
  calendar: Calendar;
}

const PERMISSION_OPTIONS = [
  { value: 'view', label: 'Can view' },
  { value: 'edit', label: 'Can edit' },
];

export function ShareCalendarModal({ open, onClose, calendar }: ShareCalendarModalProps) {
  const { shares, invitations, inviteUser, removeShare, cancelInvitation, updateSharePermission } =
    useSharing(calendar.id);

  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'view' | 'edit'>('view');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInvite = async () => {
    if (!email.trim()) return;

    setError(null);
    setSending(true);

    try {
      await inviteUser.mutateAsync({ email: email.trim(), permission });
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    if (confirm('Remove this user\'s access to the calendar?')) {
      await removeShare.mutateAsync(shareId);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    await cancelInvitation.mutateAsync(invitationId);
  };

  const handlePermissionChange = async (shareId: string, newPermission: 'view' | 'edit') => {
    await updateSharePermission.mutateAsync({ shareId, permission: newPermission });
  };

  return (
    <Modal open={open} onOpenChange={(open) => !open && onClose()} title={`Share "${calendar.name}"`}>
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="w-28">
            <Select
              value={permission}
              onValueChange={(val) => setPermission(val as 'view' | 'edit')}
              options={PERMISSION_OPTIONS}
            />
          </div>
          <Button onClick={handleInvite} disabled={sending || !email.trim()}>
            {sending ? '...' : 'Invite'}
          </Button>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {(shares.length > 0 || invitations.length > 0) && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">People with access</h3>

            <div className="space-y-2">
              {shares.map((share) => (
                <div
                  key={share.id}
                  className="flex items-center gap-2 py-2 px-3 bg-gray-50 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <span className="text-sm font-medium">
                      {share.shared_with_user_id.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">User</p>
                    <p className="text-xs text-gray-500">ID: {share.shared_with_user_id.slice(0, 8)}...</p>
                  </div>
                  <Select
                    value={share.permission}
                    onValueChange={(val) => handlePermissionChange(share.id, val as 'view' | 'edit')}
                    options={PERMISSION_OPTIONS}
                  />
                  <button
                    onClick={() => handleRemoveShare(share.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center gap-2 py-2 px-3 bg-yellow-50 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                    <Mail size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{invitation.invited_email}</p>
                    <p className="text-xs text-yellow-600">Pending invitation</p>
                  </div>
                  <span className="text-sm text-gray-500 capitalize">{invitation.permission}</span>
                  <button
                    onClick={() => handleCancelInvitation(invitation.id)}
                    className="text-gray-400 hover:text-red-500"
                    title="Cancel invitation"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}
