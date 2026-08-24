import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import studentsApi from '../../api/studentsApi';
import buildingsApi from '../../api/buildingsApi';
import classesApi from '../../api/classesApi';
import useDebounce from '../../hooks/useDebounce';
import useAuth from '../../hooks/useAuth';
import { GENDERS } from '../../utils/constants';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import FilterSelect from '../../components/common/FilterSelect';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import FormField from '../../components/common/FormField';
import SelectField from '../../components/common/SelectField';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

const EMPTY_FORM = { name: '', gender: '', buildingId: '', classId: '' };

export default function StudentsPage() {
  const { user } = useAuth();
  const isCoordinator = user?.userType === 'coordinator';

  const [students, setStudents] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const debouncedSearch = useDebounce(search);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await studentsApi.list({
        search: debouncedSearch || undefined,
        buildingId: buildingFilter || undefined,
        classId: classFilter || undefined,
      });
      setStudents(data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load students.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, buildingFilter, classFilter]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    // Masjid list is an admin-only endpoint — a coordinator never needs it
    // since their masjid is implicit/locked server-side.
    if (!isCoordinator) {
      buildingsApi.list().then((data) => setBuildings(data || [])).catch(() => setBuildings([]));
    }
    classesApi.list().then((data) => setClasses(data || [])).catch(() => setClasses([]));
  }, [isCoordinator]);

  const buildingName = (row) => row.Building?.name || row.buildingId;
  const className = (row) => row.Class?.name_ar || row.classId;

  const openAddModal = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (student) => {
    setEditing(student);
    setForm({
      name: student.name,
      gender: student.gender,
      buildingId: student.buildingId,
      classId: student.classId,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Student name is required.';
    if (!form.gender) errors.gender = 'Gender is required.';
    if (!isCoordinator && !form.buildingId) errors.buildingId = 'Masjid is required.';
    if (!form.classId) errors.classId = 'Educational Stage is required.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (editing) {
        await studentsApi.update(editing.id, {
          name: form.name,
          gender: form.gender,
          buildingId: form.buildingId,
          classId: form.classId,
        });
        toast.success('Student updated successfully.');
      } else {
        await studentsApi.create(form);
        toast.success('Student created successfully.');
      }
      setModalOpen(false);
      fetchStudents();
    } catch (err) {
      toast.error(err.message || 'Failed to save student.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await studentsApi.remove(deleteTarget.id);
      toast.success('Student deleted successfully.');
      setDeleteTarget(null);
      fetchStudents();
    } catch (err) {
      toast.error(err.message || 'Failed to delete student.');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { key: 'name', header: 'Name' },
    {
      key: 'gender',
      header: 'Gender',
      render: (row) => <Badge color={row.gender === 'Male' ? 'blue' : 'gold'}>{row.gender}</Badge>,
    },
    ...(isCoordinator ? [] : [{ key: 'building', header: 'Masjid', render: buildingName }]),
    { key: 'class', header: 'Educational Stage', render: className },
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
          <h1 className="text-2xl font-bold text-brand-red dark:text-red-400">Student Registration</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage students, their masjid and educational stage.</p>
        </div>
        <Button onClick={openAddModal}>+ Add Student</Button>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <SearchBar value={search} onChange={setSearch} placeholder="Search students..." />
        {!isCoordinator && (
          <FilterSelect
            value={buildingFilter}
            onChange={(val) => setBuildingFilter(val ? Number(val) : '')}
            options={buildings}
            valueKey="id"
            labelKey="name"
            placeholder="All Masjids"
          />
        )}
        <FilterSelect
          value={classFilter}
          onChange={(val) => setClassFilter(val ? Number(val) : '')}
          options={classes}
          valueKey="id"
          labelKey="name_ar"
          placeholder="All Educational Stages"
        />
      </div>

      <DataTable columns={columns} data={students} loading={loading} emptyMessage="No students found" />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Student' : 'Add Student'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField
            label="Student Name"
            name="name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            error={formErrors.name}
            required
          />
          <SelectField
            label="Gender"
            name="gender"
            value={form.gender}
            onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
            options={GENDERS}
            error={formErrors.gender}
            required
          />
          {!isCoordinator && (
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
          )}
          <SelectField
            label="Educational Stage"
            name="classId"
            value={form.classId}
            onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value ? Number(e.target.value) : '' }))}
            options={classes}
            valueKey="id"
            labelKey="name_ar"
            error={formErrors.classId}
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
        title="Delete Student"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}
