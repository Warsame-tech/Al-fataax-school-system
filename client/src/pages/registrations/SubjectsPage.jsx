import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import subjectsApi from '../../api/subjectsApi';
import fansApi from '../../api/fansApi';
import useDebounce from '../../hooks/useDebounce';
import FanPivotTable from '../../components/common/FanPivotTable';
import SearchBar from '../../components/common/SearchBar';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import FormField from '../../components/common/FormField';
import SelectField from '../../components/common/SelectField';
import Button from '../../components/common/Button';
import LoadingState from '../../components/common/LoadingState';

const EMPTY_FORM = { name_ar: '', fanId: '' };

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
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

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await subjectsApi.list({ search: debouncedSearch || undefined });
      setSubjects(data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load religious books.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  useEffect(() => {
    fansApi.list().then((data) => setFans(data || [])).catch(() => setFans([]));
  }, []);

  const openAddModal = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (subject) => {
    setEditing(subject);
    setForm({ name_ar: subject.name_ar, fanId: subject.fanId });
    setFormErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const errors = {};
    if (!form.name_ar.trim()) errors.name_ar = 'Book name is required.';
    if (!form.fanId) errors.fanId = 'Fan is required.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (editing) {
        await subjectsApi.update(editing.id, { name_ar: form.name_ar, fanId: form.fanId });
        toast.success('Religious Book updated successfully.');
      } else {
        await subjectsApi.create({ name_ar: form.name_ar, fanId: form.fanId });
        toast.success('Religious Book created successfully.');
      }
      setModalOpen(false);
      fetchSubjects();
    } catch (err) {
      toast.error(err.message || 'Failed to save religious book.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await subjectsApi.remove(deleteTarget.id);
      toast.success('Religious Book deleted successfully.');
      setDeleteTarget(null);
      fetchSubjects();
    } catch (err) {
      toast.error(err.message || 'Failed to delete religious book.');
    } finally {
      setDeleting(false);
    }
  };

  const renderCell = (book) => (
    <div className="group flex items-center justify-between gap-3">
      <span dir="rtl" className="flex-1 text-right">
        {book.name_ar}
      </span>
      <div className="flex shrink-0 gap-1 opacity-40 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={() => openEditModal(book)}
          aria-label={`Edit ${book.name_ar}`}
          className="rounded p-1 text-brand-red hover:bg-brand-red/10 dark:text-red-400 dark:hover:bg-brand-red/20"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => setDeleteTarget(book)}
          aria-label={`Delete ${book.name_ar}`}
          className="rounded p-1 text-status-error hover:bg-status-error/10"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-red dark:text-red-400">Religious Book Registration</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage religious books, grouped by fan.</p>
        </div>
        <Button onClick={openAddModal}>+ Add Religious Book</Button>
      </div>

      <div className="mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search religious books..." />
      </div>

      {loading ? (
        <LoadingState />
      ) : (
        <FanPivotTable books={subjects} renderCell={renderCell} emptyMessage="No religious books found." />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Religious Book' : 'Add Religious Book'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField
            label="Book Name"
            name="name_ar"
            value={form.name_ar}
            onChange={(e) => setForm((f) => ({ ...f, name_ar: e.target.value }))}
            error={formErrors.name_ar}
            dir="rtl"
            inputClassName="text-right"
            required
          />
          <SelectField
            label="Fan"
            name="fanId"
            value={form.fanId}
            onChange={(e) => setForm((f) => ({ ...f, fanId: e.target.value ? Number(e.target.value) : '' }))}
            options={fans}
            valueKey="id"
            labelKey="name_ar"
            optionsDir="rtl"
            error={formErrors.fanId}
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
        title="Delete Religious Book"
        message={`Are you sure you want to delete "${deleteTarget?.name_ar}"? This action cannot be undone.`}
      />
    </div>
  );
}
