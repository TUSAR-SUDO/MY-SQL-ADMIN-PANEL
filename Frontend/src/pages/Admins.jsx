import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, ShieldCheck, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { getAdmins, createAdmin, updateAdmin, deleteAdmin } from '../api';
import { useAuth } from '../context/AuthContext';

const emptyForm = { name: '', email: '', password: '', role: 'sub_admin' };

const Admins = () => {
  const { admin: currentAdmin } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdmins();
      setAdmins(res.data);
      setLoadError('');
    } catch (err) {
      // There is always at least one admin, so an empty list here means the
      // request failed — say which, instead of showing "none found".
      setLoadError(
        err.response?.data?.message ||
          (err.response
            ? `The API replied ${err.response.status}.`
            : 'The API did not respond. Is the backend running?')
      );
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (a) => {
    setEditing(a);
    setForm({ name: a.name, email: a.email, password: '', role: a.role });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const data = { name: form.name, email: form.email, role: form.role };
        if (form.password) data.password = form.password;
        await updateAdmin(editing._id, data);
        toast.success('Admin updated');
      } else {
        await createAdmin(form);
        toast.success('Admin created');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save admin');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteAdmin(deleteTarget._id);
      toast.success('Admin removed');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete admin');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-gradient text-sm font-bold text-white">
            {r.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-ink">{r.name}</p>
            {r._id === currentAdmin?._id && <p className="text-xs font-semibold text-primary-600">You</p>}
          </div>
        </div>
      ),
    },
    { key: 'email', label: 'Email', render: (r) => <span className="text-muted">{r.email}</span> },
    {
      key: 'role',
      label: 'Role',
      render: (r) => (
        <span className={r.role === 'super_admin' ? 'badge-primary' : 'badge-neutral'}>
          {r.role === 'super_admin' ? <ShieldCheck size={12} /> : <Shield size={12} />}
          {r.role === 'super_admin' ? 'Super admin' : 'Sub admin'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Added',
      render: (r) => <span className="text-muted">{new Date(r.createdAt).toLocaleDateString()}</span>,
    },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => openEdit(r)}
            className="rounded-lg p-2 text-muted transition-colors hover:bg-primary-50 hover:text-primary-700"
            title="Edit"
            aria-label={`Edit ${r.name}`}
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => setDeleteTarget(r)}
            disabled={r._id === currentAdmin?._id}
            className="rounded-lg p-2 text-muted transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
            title={r._id === currentAdmin?._id ? "You can't remove your own account" : 'Remove'}
            aria-label={`Remove ${r.name}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-sm text-muted">
          Super admins can add and remove accounts. Sub admins manage projects and questions only.
        </p>
        <motion.button whileTap={{ scale: 0.97 }} onClick={openAdd} className="btn-primary shrink-0">
          <Plus size={16} />
          Add admin
        </motion.button>
      </div>

      <DataTable
        columns={columns}
        data={admins}
        page={1}
        total={admins.length}
        limit={admins.length || 1}
        onPageChange={() => {}}
        loading={loading}
        error={loadError}
        onRetry={load}
        emptyMessage="No admin accounts"
        emptyHint="That's unusual — there should always be at least one. Try reloading."
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit admin' : 'Add admin'}
        description={
          editing ? 'Leave the password blank to keep the current one.' : 'They can sign in as soon as you save.'
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              placeholder="Admin name"
              required
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input"
              placeholder="admin@example.com"
              required
            />
          </div>
          <div>
            <label className="label">{editing ? 'New password' : 'Password'}</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input"
              placeholder={editing ? 'Leave blank to keep the current one' : 'At least 6 characters'}
              minLength={editing ? 0 : 6}
              required={!editing}
            />
          </div>
          <div>
            <label className="label">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="input"
            >
              <option value="sub_admin">Sub admin</option>
              <option value="super_admin">Super admin</option>
            </select>
            <p className="hint">Only super admins can reach this page.</p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create admin'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove admin"
        message={`${deleteTarget?.name} will lose access to this panel immediately. Projects and questions they created stay.`}
        confirmText="Remove"
        loading={deleting}
      />
    </div>
  );
};

export default Admins;