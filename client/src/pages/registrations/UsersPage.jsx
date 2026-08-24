import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import usersApi from '../../api/usersApi';
import teachersApi from '../../api/teachersApi';
import studentsApi from '../../api/studentsApi';
import coordinatorsApi from '../../api/coordinatorsApi';
import useDataSync from '../../hooks/useDataSync';
import useDebounce from '../../hooks/useDebounce';
import { USER_TYPES, USERNAME_PATTERN } from '../../utils/constants';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import FilterSelect from '../../components/common/FilterSelect';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import FormField from '../../components/common/FormField';
import SelectField from '../../components/common/SelectField';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

// Order requested for the Add/Edit form's User Type select — distinct from
// USER_TYPES (used for the filter dropdown), which keeps admin first.
const USER_TYPE_FORM_OPTIONS = [
  { value: 'student', label: 'Student' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'admin', label: 'Admin' },
  { value: 'coordinator', label: 'Coordinator' },
];

const USER_TYPE_COLORS = { admin: 'red', teacher: 'green', student: 'gold', coordinator: 'blue' };

const EMPTY_FORM = { username: '', password: '', userType: '', teacherId: '', studentId: '', coordinatorId: '' };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const debouncedSearch = useDebounce(search);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await usersApi.list({
        search: debouncedSearch || undefined,
        userType: userTypeFilter || undefined,
      });
      setUsers(data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, userTypeFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useDataSync(['users'], fetchUsers);

  const fetchLinkableRecords = useCallback(() => {
    teachersApi.list().then((data) => setTeachers(data || [])).catch(() => setTeachers([]));
    studentsApi.list().then((data) => setStudents(data || [])).catch(() => setStudents([]));
    coordinatorsApi.list().then((data) => setCoordinators(data || [])).catch(() => setCoordinators([]));
  }, []);

  useEffect(() => {
    fetchLinkableRecords();
  }, [fetchLinkableRecords]);

  useDataSync(['teachers', 'students', 'coordinators'], fetchLinkableRecords);

  const openAddModal = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditing(user);
    setForm({
      username: user.username,
      password: '',
      userType: user.userType,
      teacherId: user.teacherId || '',
      studentId: user.studentId || '',
      coordinatorId: user.coordinatorId || '',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleUserTypeChange = (value) => {
    setForm((f) => ({ ...f, userType: value, teacherId: '', studentId: '', coordinatorId: '' }));
  };

  const validate = () => {
    const errors = {};
    const username = form.username.trim();
    if (!username) {
      errors.username = 'Username is required.';
    } else if (username.length < 3 || username.length > 100) {
      errors.username = 'Username must be 3-100 characters.';
    } else if (!USERNAME_PATTERN.test(username)) {
      errors.username = 'Username may only contain letters, numbers, and underscores.';
    }
    if (!editing && !form.password.trim()) {
      errors.password = 'Password is required.';
    } else if (form.password.trim() && form.password.trim().length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }
    if (!form.userType) errors.userType = 'User type is required.';
    if (form.userType === 'teacher' && !form.teacherId) errors.teacherId = 'Teacher is required.';
    if (form.userType === 'student' && !form.studentId) errors.studentId = 'Student is required.';
    if (form.userType === 'coordinator' && !form.coordinatorId) errors.coordinatorId = 'Coordinator is required.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildPayload = () => {
    const payload = { username: form.username.trim(), userType: form.userType };
    if (form.password.trim()) payload.password = form.password;
    if (form.userType === 'teacher') payload.teacherId = form.teacherId;
    if (form.userType === 'student') payload.studentId = form.studentId;
    if (form.userType === 'coordinator') payload.coordinatorId = form.coordinatorId;
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (editing) {
        await usersApi.update(editing.id, buildPayload());
        toast.success('User updated successfully.');
      } else {
        await usersApi.create(buildPayload());
        toast.success('User created successfully.');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Failed to save user.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await usersApi.remove(deleteTarget.id);
      toast.success('User deleted successfully.');
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Failed to delete user.');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { key: 'username', header: 'Username' },
    {
      key: 'userType',
      header: 'User Type',
      render: (row) => (
        <Badge color={USER_TYPE_COLORS[row.userType] || 'neutral'} className="capitalize">
          {row.userType}
        </Badge>
      ),
    },
    {
      key: 'associated',
      header: 'Associated Person',
      render: (row) => row.Teacher?.name || row.Student?.name || row.Coordinator?.name || '—',
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
          <h1 className="text-2xl font-bold text-brand-red dark:text-red-400">User Registration</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage login accounts for admins, teachers, students and coordinators.</p>
        </div>
        <Button onClick={openAddModal}>+ Add User</Button>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar value={search} onChange={setSearch} placeholder="Search users..." />
        <FilterSelect
          value={userTypeFilter}
          onChange={setUserTypeFilter}
          options={USER_TYPES}
          placeholder="All User Types"
        />
      </div>

      <DataTable columns={columns} data={users} loading={loading} emptyMessage="No users found" />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit User' : 'Add User'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <SelectField
            label="User Type"
            name="userType"
            value={form.userType}
            onChange={(e) => handleUserTypeChange(e.target.value)}
            options={USER_TYPE_FORM_OPTIONS}
            error={formErrors.userType}
            required
          />
          {form.userType === 'student' && (
            <SelectField
              label="Student"
              name="studentId"
              value={form.studentId}
              onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value ? Number(e.target.value) : '' }))}
              options={students}
              valueKey="id"
              labelKey="name"
              error={formErrors.studentId}
              required
            />
          )}
          {form.userType === 'teacher' && (
            <SelectField
              label="Teacher"
              name="teacherId"
              value={form.teacherId}
              onChange={(e) => setForm((f) => ({ ...f, teacherId: e.target.value ? Number(e.target.value) : '' }))}
              options={teachers}
              valueKey="id"
              labelKey="name"
              error={formErrors.teacherId}
              required
            />
          )}
          {form.userType === 'coordinator' && (
            <SelectField
              label="Coordinator"
              name="coordinatorId"
              value={form.coordinatorId}
              onChange={(e) => setForm((f) => ({ ...f, coordinatorId: e.target.value ? Number(e.target.value) : '' }))}
              options={coordinators}
              valueKey="id"
              labelKey="name"
              error={formErrors.coordinatorId}
              required
            />
          )}
          <FormField
            label="Username"
            name="username"
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            error={formErrors.username}
            placeholder="e.g. student123"
            autoComplete="username"
            required
          />
          <FormField
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            error={formErrors.password}
            required={!editing}
            hint={editing ? 'Leave blank to keep current password.' : undefined}
            autoComplete="new-password"
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
        title="Delete User"
        message={`Are you sure you want to delete "${deleteTarget?.username}"? This action cannot be undone.`}
      />
    </div>
  );
}
