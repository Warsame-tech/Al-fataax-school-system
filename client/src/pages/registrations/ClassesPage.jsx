import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import classesApi from '../../api/classesApi';
import subjectsApi from '../../api/subjectsApi';
import useDataSync from '../../hooks/useDataSync';
import useDebounce from '../../hooks/useDebounce';
import FanPivotTable from '../../components/common/FanPivotTable';
import SearchBar from '../../components/common/SearchBar';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';

const EMPTY_FORM = { name_ar: '', bookIds: [] };

export default function ClassesPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [availableBooks, setAvailableBooks] = useState([]);
  const [availableBooksLoading, setAvailableBooksLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await classesApi.list({ search: debouncedSearch || undefined });
      setClasses(data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load educational stages.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // Classes carry their assigned religious books (Subjects) inline, so a
  // book rename/create/delete elsewhere also needs a refetch here, not just
  // a stage change.
  useDataSync(['stages', 'books'], fetchClasses);

  const loadAvailableBooks = async (excludeStageId) => {
    setAvailableBooksLoading(true);
    try {
      const data = await subjectsApi.list({
        unassignedOnly: true,
        excludeStageId: excludeStageId || undefined,
      });
      setAvailableBooks(data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load available religious books.');
      setAvailableBooks([]);
    } finally {
      setAvailableBooksLoading(false);
    }
  };

  const openAddModal = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setModalOpen(true);
    loadAvailableBooks(null);
  };

  const openEditModal = (cls) => {
    setEditing(cls);
    setForm({
      name_ar: cls.name_ar,
      bookIds: (cls.Subjects || []).map((s) => s.id),
    });
    setFormErrors({});
    setModalOpen(true);
    loadAvailableBooks(cls.id);
  };

  const toggleBook = (bookId) => {
    setForm((f) => {
      const has = f.bookIds.includes(bookId);
      return {
        ...f,
        bookIds: has ? f.bookIds.filter((id) => id !== bookId) : [...f.bookIds, bookId],
      };
    });
  };

  const validate = () => {
    const errors = {};
    if (!form.name_ar.trim()) errors.name_ar = 'Stage name is required.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (editing) {
        await classesApi.update(editing.id, { name_ar: form.name_ar, bookIds: form.bookIds });
        toast.success('Educational Stage updated successfully.');
      } else {
        await classesApi.create({ name_ar: form.name_ar, bookIds: form.bookIds });
        toast.success('Educational Stage created successfully.');
      }
      setModalOpen(false);
      fetchClasses();
    } catch (err) {
      // Surfaces the 409 exclusivity message (a book already assigned to
      // another stage) exactly like any other save failure, in case of a
      // race with another admin — the primary UX guard is that the modal
      // only ever lists currently-unassigned books.
      toast.error(err.message || 'Failed to save educational stage.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await classesApi.remove(deleteTarget.id);
      toast.success('Educational Stage deleted successfully.');
      setDeleteTarget(null);
      fetchClasses();
    } catch (err) {
      toast.error(err.message || 'Failed to delete educational stage.');
    } finally {
      setDeleting(false);
    }
  };

  const renderCheckboxCell = (book) => (
    <label className="flex cursor-pointer items-center justify-between gap-2">
      <span dir="rtl" className="flex-1 text-right text-gray-700 dark:text-gray-200">
        {book.name_ar}
      </span>
      <input
        type="checkbox"
        checked={form.bookIds.includes(book.id)}
        onChange={() => toggleBook(book.id)}
        className="h-4 w-4 shrink-0 rounded border-gray-300 text-brand-gold focus:ring-brand-gold dark:border-gray-600 dark:bg-gray-800"
      />
    </label>
  );

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-red dark:text-red-400">Educational Stage Registration</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage educational stages and their religious books.</p>
        </div>
        <Button onClick={openAddModal}>+ Add Educational Stage</Button>
      </div>

      <div className="mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search educational stages..." />
      </div>

      {loading ? (
        <LoadingState />
      ) : classes.length === 0 ? (
        <EmptyState message="No educational stages found." />
      ) : (
        <div className="flex flex-col gap-6">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4 dark:border-gray-700">
                <h2 dir="rtl" className="text-xl font-bold text-brand-red dark:text-red-400">
                  {cls.name_ar}
                </h2>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEditModal(cls)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setDeleteTarget(cls)}>
                    Delete
                  </Button>
                </div>
              </div>

              {(cls.Subjects || []).length === 0 ? (
                <p className="py-4 text-sm text-gray-400 dark:text-gray-500">No religious books assigned yet.</p>
              ) : (
                <FanPivotTable books={cls.Subjects} />
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Educational Stage' : 'Add Educational Stage'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField
            label="Stage Name"
            name="name_ar"
            value={form.name_ar}
            onChange={(e) => setForm((f) => ({ ...f, name_ar: e.target.value }))}
            error={formErrors.name_ar}
            dir="rtl"
            inputClassName="text-right"
            required
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Religious Books</label>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Only books not already assigned to another educational stage are shown, grouped by fan.
            </p>
            <div className="max-h-72 overflow-y-auto">
              {availableBooksLoading ? (
                <LoadingState label="Loading available religious books..." />
              ) : (
                <FanPivotTable
                  books={availableBooks}
                  renderCell={renderCheckboxCell}
                  emptyMessage="No unassigned religious books available."
                />
              )}
            </div>
          </div>
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
        title="Delete Educational Stage"
        message={`Are you sure you want to delete "${deleteTarget?.name_ar}"? This action cannot be undone.`}
      />
    </div>
  );
}
