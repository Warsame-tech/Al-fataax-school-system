import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import teachersApi from '../../api/teachersApi';
import buildingsApi from '../../api/buildingsApi';
import useDataSync from '../../hooks/useDataSync';
import useDebounce from '../../hooks/useDebounce';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import FilterSelect from '../../components/common/FilterSelect';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import FormField from '../../components/common/FormField';
import SelectField from '../../components/common/SelectField';
import Button from '../../components/common/Button';

const EMPTY_FORM = { name: '', buildingId: '' };

export default function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('');
  const debouncedSearch = useDebounce(search);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await teachersApi.list({
        search: debouncedSearch || undefined,
        buildingId: buildingFilter || undefined,
      });
      setTeachers(data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load teachers.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, buildingFilter]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  useDataSync(['teachers'], fetchTeachers);

  const fetchBuildings = useCallback(() => {
    buildingsApi
      .list()
      .then((data) => setBuildings(data || []))
      .catch(() => setBuildings([]));
  }, []);

  useEffect(() => {
    fetchBuildings();
  }, [fetchBuildings]);

  useDataSync(['masjids'], fetchBuildings);

  const buildingName = (row) => row.Building?.name || row.buildingId;

  const openAddModal = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (teacher) => {
    setEditing(teacher);
    setForm({ name: teacher.name, buildingId: teacher.buildingId });
    setFormErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Teacher name is required.';
    if (!form.buildingId) errors.buildingId = 'Masjid is required.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (editing) {
        await teachersApi.update(editing.id, { name: form.name, buildingId: form.buildingId });
        toast.success('Teacher updated successfully.');
      } else {
        await teachersApi.create(form);
        toast.success('Teacher created successfully.');
      }
      setModalOpen(false);
      fetchTeachers();
    } catch (err) {
      toast.error(err.message || 'Failed to save teacher.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await teachersApi.remove(deleteTarget.id);
      toast.success('Teacher deleted successfully.');
      setDeleteTarget(null);
      fetchTeachers();
    } catch (err) {
      toast.error(err.message || 'Failed to delete teacher.');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'building', header: 'Masjid', render: buildingName },
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
          <h1 className="text-2xl font-bold text-brand-red dark:text-red-400">Teacher Registration</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage teachers and their assigned masjid.</p>
        </div>
        <Button onClick={openAddModal}>+ Add Teacher</Button>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar value={search} onChange={setSearch} placeholder="Search teachers..." />
        <FilterSelect
          value={buildingFilter}
          onChange={(val) => setBuildingFilter(val ? Number(val) : '')}
          options={buildings}
          valueKey="id"
          labelKey="name"
          placeholder="All Masjids"
        />
      </div>

      <DataTable columns={columns} data={teachers} loading={loading} emptyMessage="No teachers found" />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Teacher' : 'Add Teacher'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField
            label="Teacher Name"
            name="name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            error={formErrors.name}
            required
          />
          <SelectField
            label="Masjid"
            name="buildingId"
            value={form.buildingId}
            onChange={(e) => setForm((f) => ({ ...f, buildingId: e.target.value ? Number(e.target.value) : '' }))}
            options={buildings}
            valueKey="id"
            labelKey="name"
            error={formErrors.buildingId}
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
        title="Delete Teacher"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}
