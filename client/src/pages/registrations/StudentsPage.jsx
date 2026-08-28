import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import studentsApi from '../../api/studentsApi';
import studentStagesApi from '../../api/studentStagesApi';
import buildingsApi from '../../api/buildingsApi';
import classesApi from '../../api/classesApi';
import useDataSync from '../../hooks/useDataSync';
import useDebounce from '../../hooks/useDebounce';
import useAuth from '../../hooks/useAuth';
import { GENDERS, STUDENT_ID_PATTERN } from '../../utils/constants';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import FilterSelect from '../../components/common/FilterSelect';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import FormField from '../../components/common/FormField';
import SelectField from '../../components/common/SelectField';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingState from '../../components/common/LoadingState';

const EMPTY_FORM = { id: '', name: '', gender: '', buildingId: '' };

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

  const [renameTarget, setRenameTarget] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameError, setRenameError] = useState('');
  const [renaming, setRenaming] = useState(false);

  const [stagesTarget, setStagesTarget] = useState(null);
  const [stageRegistrations, setStageRegistrations] = useState([]);
  const [stagesLoading, setStagesLoading] = useState(false);
  const [newStageId, setNewStageId] = useState('');
  const [addingStage, setAddingStage] = useState(false);

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

  useDataSync(['students'], fetchStudents);

  const fetchDropdownData = useCallback(() => {
    // Masjid list is an admin-only endpoint — a coordinator never needs it
    // since their masjid is implicit/locked server-side.
    if (!isCoordinator) {
      buildingsApi.list().then((data) => setBuildings(data || [])).catch(() => setBuildings([]));
    }
    classesApi.list().then((data) => setClasses(data || [])).catch(() => setClasses([]));
  }, [isCoordinator]);

  useEffect(() => {
    fetchDropdownData();
  }, [fetchDropdownData]);

  useDataSync(['masjids', 'stages'], fetchDropdownData);

  const buildingName = (row) => row.Building?.name || row.buildingId;
  const stageNames = (row) => (row.Stages && row.Stages.length ? row.Stages.map((s) => s.name_ar).join(', ') : '—');

  const openAddModal = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (student) => {
    setEditing(student);
    setForm({
      id: student.id,
      name: student.name,
      gender: student.gender,
      buildingId: student.buildingId,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const errors = {};
    if (!editing) {
      const id = form.id.trim();
      if (!id) {
        errors.id = 'Student ID is required.';
      } else if (id.length < 3 || id.length > 30 || !STUDENT_ID_PATTERN.test(id)) {
        errors.id = 'Student ID must be 3-30 characters (letters, numbers, hyphens only).';
      }
    }
    if (!form.name.trim()) errors.name = 'Student name is required.';
    if (!form.gender) errors.gender = 'Gender is required.';
    if (!isCoordinator && !form.buildingId) errors.buildingId = 'Masjid is required.';
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
        });
        toast.success('Student updated successfully.');
      } else {
        await studentsApi.create({
          id: form.id.trim(),
          name: form.name,
          gender: form.gender,
          buildingId: form.buildingId,
        });
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

  const openRenameModal = (student) => {
    setRenameTarget(student);
    setRenameValue(student.id);
    setRenameError('');
  };

  const handleRename = async (e) => {
    e.preventDefault();
    const newId = renameValue.trim();
    if (!newId || newId.length < 3 || newId.length > 30 || !STUDENT_ID_PATTERN.test(newId)) {
      setRenameError('Student ID must be 3-30 characters (letters, numbers, hyphens only).');
      return;
    }
    setRenaming(true);
    try {
      await studentsApi.rename(renameTarget.id, newId);
      toast.success('Student ID updated successfully.');
      setRenameTarget(null);
      fetchStudents();
    } catch (err) {
      setRenameError(err.message || 'Failed to rename student.');
    } finally {
      setRenaming(false);
    }
  };

  const openStagesModal = async (student) => {
    setStagesTarget(student);
    setNewStageId('');
    setStagesLoading(true);
    try {
      const data = await studentStagesApi.list(student.id);
      setStageRegistrations(data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load stage registrations.');
      setStageRegistrations([]);
    } finally {
      setStagesLoading(false);
    }
  };

  const handleAddStage = async (e) => {
    e.preventDefault();
    if (!newStageId) return;
    setAddingStage(true);
    try {
      await studentStagesApi.add(stagesTarget.id, newStageId);
      const data = await studentStagesApi.list(stagesTarget.id);
      setStageRegistrations(data || []);
      setNewStageId('');
      fetchStudents();
    } catch (err) {
      toast.error(err.message || 'Failed to add stage registration.');
    } finally {
      setAddingStage(false);
    }
  };

  const handleRemoveStage = async (regId) => {
    try {
      await studentStagesApi.remove(stagesTarget.id, regId);
      setStageRegistrations((prev) => prev.filter((r) => r.id !== regId));
      fetchStudents();
    } catch (err) {
      toast.error(err.message || 'Failed to remove stage registration.');
    }
  };

  const availableStagesToAdd = classes.filter(
    (c) => !stageRegistrations.some((r) => r.classId === c.id),
  );

  const columns = [
    { key: 'id', header: 'Student ID' },
    { key: 'name', header: 'Name' },
    {
      key: 'gender',
      header: 'Gender',
      render: (row) => <Badge color={row.gender === 'Male' ? 'blue' : 'gold'}>{row.gender}</Badge>,
    },
    ...(isCoordinator ? [] : [{ key: 'building', header: 'Masjid', render: buildingName }]),
    { key: 'stages', header: 'Educational Stages', render: (row) => <span dir="rtl">{stageNames(row)}</span> },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => openEditModal(row)}>
            Edit
          </Button>
          <Button size="sm" variant="outline" onClick={() => openStagesModal(row)}>
            Manage Stages
          </Button>
          <Button size="sm" variant="outline" onClick={() => openRenameModal(row)}>
            Rename ID
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
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage students, their masjid and educational stages.</p>
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
          {editing ? (
            <FormField label="Student ID" name="id" value={form.id} disabled />
          ) : (
            <FormField
              label="Student ID"
              name="id"
              value={form.id}
              onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
              error={formErrors.id}
              placeholder="e.g. STD001, STU-A102"
              required
            />
          )}
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
          {!editing && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Educational stages are assigned afterward via "Manage Stages" — a student can be registered for
              more than one.
            </p>
          )}
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

      <Modal open={!!renameTarget} onClose={() => setRenameTarget(null)} title="Rename Student ID">
        <form onSubmit={handleRename} className="flex flex-col gap-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Renaming <span className="font-semibold">{renameTarget?.name}</span>'s Student ID also updates their
            login username and every existing result — nothing is lost.
          </p>
          <FormField
            label="New Student ID"
            name="newId"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            error={renameError}
            required
          />
          <div className="mt-2 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setRenameTarget(null)} disabled={renaming}>
              Cancel
            </Button>
            <Button type="submit" disabled={renaming}>
              {renaming ? 'Renaming...' : 'Rename'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!stagesTarget} onClose={() => setStagesTarget(null)} title={`Manage Stages — ${stagesTarget?.name || ''}`}>
        <div className="flex flex-col gap-4">
          {stagesLoading ? (
            <LoadingState label="Loading stages..." />
          ) : (
            <>
              {stageRegistrations.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Not registered for any stage yet.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {stageRegistrations.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700"
                    >
                      <span dir="rtl">{r.stageName}</span>
                      <Button size="sm" variant="danger" onClick={() => handleRemoveStage(r.id)}>
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              )}

              <form onSubmit={handleAddStage} className="flex items-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-700">
                <div className="flex-1">
                  <SelectField
                    label="Add a stage"
                    name="newStageId"
                    value={newStageId}
                    onChange={(e) => setNewStageId(e.target.value ? Number(e.target.value) : '')}
                    options={availableStagesToAdd}
                    valueKey="id"
                    labelKey="name_ar"
                    optionsDir="rtl"
                    placeholder={availableStagesToAdd.length ? 'Select...' : 'All stages already added'}
                    disabled={!availableStagesToAdd.length}
                  />
                </div>
                <Button type="submit" disabled={!newStageId || addingStage}>
                  {addingStage ? 'Adding...' : 'Add'}
                </Button>
              </form>
            </>
          )}
        </div>
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
