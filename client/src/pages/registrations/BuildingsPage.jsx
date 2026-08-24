import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import buildingsApi from '../../api/buildingsApi';
import useDataSync from '../../hooks/useDataSync';
import useDebounce from '../../hooks/useDebounce';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';

const EMPTY_FORM = { name: '' };

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState([]);
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

  const fetchBuildings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await buildingsApi.list({ search: debouncedSearch || undefined });
      setBuildings(data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load masjids.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchBuildings();
  }, [fetchBuildings]);

  useDataSync(['masjids'], fetchBuildings);

  const openAddModal = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (building) => {
    setEditing(building);
    setForm({ name: building.name });
    setFormErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Masjid name is required.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (editing) {
        await buildingsApi.update(editing.id, { name: form.name });
        toast.success('Masjid updated successfully.');
      } else {
        await buildingsApi.create({ name: form.name });
        toast.success('Masjid created successfully.');
      }
      setModalOpen(false);
      fetchBuildings();
    } catch (err) {
      toast.error(err.message || 'Failed to save masjid.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await buildingsApi.remove(deleteTarget.id);
      toast.success('Masjid deleted successfully.');
      setDeleteTarget(null);
      fetchBuildings();
    } catch (err) {
      toast.error(err.message || 'Failed to delete masjid.');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <span dir="rtl" className="block text-right">
          {row.name}
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
          <h1 className="text-2xl font-bold text-brand-red dark:text-red-400">Masjid Registration</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage masjids.</p>
        </div>
        <Button onClick={openAddModal}>+ Add Masjid</Button>
      </div>

      <div className="mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search masjids..." />
      </div>

      <DataTable columns={columns} data={buildings} loading={loading} emptyMessage="No masjids found" />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Masjid' : 'Add Masjid'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField
            label="Masjid Name"
            name="name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            error={formErrors.name}
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
        title="Delete Masjid"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}
