import { useState, useEffect } from 'react';
import { getTasks, createTask, updateTask, deleteTask } from '../../services/taskService';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';
import styles from './Tasks.module.css';

const emptyForm = {
  title: '',
  description: '',
};

const getErrorMessage = (err, fallback) => {
  const details = err.response?.data?.details;
  if (Array.isArray(details) && details.length > 0) {
    return details.join('. ');
  }
  return fallback;
};

const validateTask = (data) => {
  const errors = {};
  const title = data.title.trim();

  if (!title) {
    errors.title = 'El título es obligatorio';
  } else if (title.length < 3 || title.length > 100) {
    errors.title = 'El título debe tener entre 3 y 100 caracteres';
  }

  if (data.description.length > 500) {
    errors.description = 'La descripción no puede tener más de 500 caracteres';
  }

  return errors;
};

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [requestVersion, setRequestVersion] = useState(0);
  const [formData, setFormData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [creating, setCreating] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editData, setEditData] = useState(emptyForm);
  const [editErrors, setEditErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let active = true;

    const loadTasks = async () => {
      try {
        const response = await getTasks();
        if (!active) {
          return;
        }
        setTasks(response.items);
        setLoadError(null);
      } catch (err) {
        if (active) {
          setLoadError(getErrorMessage(err, 'No se pudieron cargar las tareas'));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadTasks();
    return () => {
      active = false;
    };
  }, [requestVersion]);

  const reloadTasks = () => {
    setLoading(true);
    setLoadError(null);
    setRequestVersion((version) => version + 1);
  };

  const showSuccess = (message) => {
    setError(null);
    setSuccess(message);
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    const errors = validateTask(formData);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setCreating(true);
    try {
      await createTask({
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        completed: false,
      });
      setFormData(emptyForm);
      showSuccess('Tarea creada correctamente');
      reloadTasks();
    } catch (err) {
      setSuccess(null);
      setError(getErrorMessage(err, 'No se pudo crear la tarea'));
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setEditData({
      title: task.title,
      description: task.description ?? '',
    });
    setEditErrors({});
  };

  const closeEditModal = () => {
    setEditingTask(null);
    setEditErrors({});
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    const errors = validateTask(editData);
    setEditErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setSaving(true);
    try {
      await updateTask(editingTask.id, {
        title: editData.title.trim(),
        description: editData.description.trim() || null,
        completed: editingTask.completed,
      });
      closeEditModal();
      showSuccess('Tarea actualizada correctamente');
      reloadTasks();
    } catch (err) {
      setEditErrors({ form: getErrorMessage(err, 'No se pudo actualizar la tarea') });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (task) => {
    if (!window.confirm(`¿Seguro que quieres eliminar "${task.title}"?`)) {
      return;
    }

    setDeletingId(task.id);
    try {
      await deleteTask(task.id);
      showSuccess('Tarea eliminada correctamente');
      reloadTasks();
    } catch (err) {
      setSuccess(null);
      setError(getErrorMessage(err, 'No se pudo eliminar la tarea'));
    } finally {
      setDeletingId(null);
    }
  };

  const renderList = () => {
    if (loading) {
      return <div className={styles.loading}>Cargando tareas...</div>;
    }

    if (loadError) {
      return (
        <Card className={styles.errorBox}>
          <p className={styles.errorText}>{loadError}</p>
          <Button variant="outline" onClick={reloadTasks}>
            Reintentar
          </Button>
        </Card>
      );
    }

    if (tasks.length === 0) {
      return (
        <Card className={styles.empty}>
          <p className={styles.emptyText}>No tienes tareas todavía</p>
        </Card>
      );
    }

    return (
      <ul className={styles.taskList}>
        {tasks.map((task) => (
          <li key={task.id} className={styles.taskItem}>
            <div className={styles.taskInfo}>
              <h3 className={styles.taskTitle}>{task.title}</h3>
              {task.description && (
                <p className={styles.taskDescription}>{task.description}</p>
              )}
            </div>
            <div className={styles.taskActions}>
              <span
                className={`${styles.badge} ${task.completed ? styles.done : styles.pending}`}
              >
                {task.completed ? 'Completada' : 'Pendiente'}
              </span>
              <Button
                variant="secondary"
                onClick={() => openEditModal(task)}
                disabled={deletingId === task.id}
              >
                Editar
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDelete(task)}
                disabled={deletingId === task.id}
              >
                {deletingId === task.id ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Gestión de Tareas</h1>
        <p className={styles.subtitle}>Administra tus tareas de forma eficiente</p>
      </div>

      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      <Card className={styles.formCard}>
        <h2 className={styles.sectionTitle}>Crear tarea</h2>
        <form onSubmit={handleCreate} noValidate>
          <Input
            label="Título"
            name="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ingrese el título de la tarea"
            error={formErrors.title}
            disabled={creating}
          />
          <div className={styles.field}>
            <label htmlFor="description" className={styles.label}>
              Descripción (opcional)
            </label>
            <textarea
              id="description"
              name="description"
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ingrese la descripción de la tarea"
              disabled={creating}
              className={`${styles.textarea} ${formErrors.description ? styles.textareaError : ''}`}
            />
            <div className={styles.fieldFooter}>
              <span className={styles.fieldError}>{formErrors.description}</span>
              <span className={styles.counter}>{formData.description.length}/500</span>
            </div>
          </div>
          <div className={styles.formActions}>
            <Button type="submit" disabled={creating}>
              {creating ? 'Creando...' : 'Crear'}
            </Button>
          </div>
        </form>
      </Card>

      <h2 className={styles.sectionTitle}>Lista de tareas</h2>
      {renderList()}

      <Modal isOpen={editingTask !== null} onClose={closeEditModal} title="Editar tarea">
        <form onSubmit={handleUpdate} noValidate>
          {editErrors.form && <Alert type="error" message={editErrors.form} />}
          <Input
            label="Título"
            name="editTitle"
            value={editData.title}
            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
            placeholder="Título de la tarea"
            error={editErrors.title}
            disabled={saving}
          />
          <div className={styles.field}>
            <label htmlFor="editDescription" className={styles.label}>
              Descripción (opcional)
            </label>
            <textarea
              id="editDescription"
              name="editDescription"
              rows="4"
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              placeholder="Descripción de la tarea"
              disabled={saving}
              className={`${styles.textarea} ${editErrors.description ? styles.textareaError : ''}`}
            />
            <div className={styles.fieldFooter}>
              <span className={styles.fieldError}>{editErrors.description}</span>
              <span className={styles.counter}>{editData.description.length}/500</span>
            </div>
          </div>
          <div className={styles.modalActions}>
            <Button type="button" variant="secondary" onClick={closeEditModal} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Tasks;
