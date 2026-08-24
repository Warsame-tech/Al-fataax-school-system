import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import fansApi from '../../api/fansApi';
import useDebounce from '../../hooks/useDebounce';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';

const EMPTY_FORM = { name_ar: '' };

export default function FansPage() {
  const [fans, setFans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchFans = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fansApi.list({ search: debouncedSearch || undefined });
      setFans(data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load fans.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchFans();
  }, [fetchFans]);

  const openAddModal = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (fan) => {
    setEditing(fan);
    setForm({ name_ar: fan.name_ar });
    setFormErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const errors = {};
    if (!form.name_ar.trim()) errors.name_ar = 'Fan name is required.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (editing) {
        await fansApi.update(editing.id, { name_ar: form.name_ar });
        toast.success('Fan updated successfully.');
      } else {
        await fansApi.create({ name_ar: form.name_ar });
        toast.success('Fan created successfully.');
      }
      setModalOpen(false);
      fetchFans();
    } catch (err) {
      toast.error(err.message || 'Failed to save fan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fansApi.remove(deleteTarget.id);
      toast.success('Fan deleted successfully.');
      setDeleteTarget(null);
      fetchFans();
    } catch (err) {
      toast.error(err.message || 'Failed to delete fan.');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'name_ar',
      header: 'Name',
      render: (row) => (
        <span dir="rtl" className="block text-right">
          {row.name_ar}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openEditModal(row)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => setDeleteTarget(row)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-red dark:text-red-400">Fan Registration</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage fans (fields of study).</p>
        </div>
        <Button onClick={openAddModal}>+ Add Fan</Button>
      </div>

      <div className="mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search fans..." />
      </div>

      <DataTable columns={columns} data={fans} loading={loading} emptyMessage="No fans found." />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Fan' : 'Add Fan'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField
            label="Fan Name"
            name="name_ar"
            value={form.name_ar}
            onChange={(e) => setForm((f) => ({ ...f, name_ar: e.target.value }))}
            error={formErrors.name_ar}
            dir="rtl"
            inputClassName="text-right"
            required
          />
          <div className="mt-2 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Fan"
        message={`Are you sure you want to delete "${deleteTarget?.name_ar}"? This action cannot be undone.`}
      />
    </div>
  );
}
