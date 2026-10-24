import { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser, changeUserPassword } from '../../services/userService';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';
import styles from './Users.module.css';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 20,
    totalItems: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    q: '',
    sort: 'username',
    dir: 'asc',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [requestVersion, setRequestVersion] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [passwordUserId, setPasswordUserId] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    let correctingPage = false;
    const params = {
      page: pagination.page,
      size: pagination.size,
      ...filters,
    };

    const loadUsers = async () => {
      try {
        const response = await getUsers(params);
        if (!active) {
          return;
        }
        setError(null);
        const lastValidPage = Math.max(0, response.totalPages - 1);
        if (pagination.page > lastValidPage) {
          correctingPage = true;
          setUsers(response.items);
          setPagination((prev) => ({
            ...prev,
            page: lastValidPage,
            totalItems: response.totalItems,
            totalPages: response.totalPages,
          }));
          return;
        }
        setUsers(response.items);
        setPagination((prev) => ({
          ...prev,
          totalItems: response.totalItems,
          totalPages: response.totalPages,
        }));
      } catch {
        if (active) {
          setError('Error al cargar los usuarios');
        }
      } finally {
        if (active && !correctingPage) {
          setLoading(false);
        }
      }
    };

    loadUsers();
    return () => {
      active = false;
    };
  }, [filters, pagination.page, pagination.size, requestVersion]);

  const handleFilterChange = (field, value) => {
    setLoading(true);
    setError(null);
    setRequestVersion((version) => version + 1);
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
    setPagination((prev) => ({ ...prev, page: 0 }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRequestVersion((version) => version + 1);
    setFilters((prev) => ({ ...prev, q: searchTerm }));
    setPagination((prev) => ({ ...prev, page: 0 }));
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const openPasswordModal = (userId) => {
    setPasswordUserId(userId);
    setPasswordData({ newPassword: '' });
    setFormErrors({});
    setShowPasswordModal(true);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.username.trim()) {
      errors.username = 'El usuario es obligatorio';
    } else if (formData.username.length < 3 || formData.username.length > 50) {
      errors.username = 'El usuario debe tener entre 3 y 50 caracteres';
    }

    if (!formData.email.trim()) {
      errors.email = 'El correo es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'El correo no tiene un formato válido';
    } else if (formData.email.length > 100) {
      errors.email = 'El correo no puede tener más de 100 caracteres';
    }

    if (!editingUser && !formData.password) {
      errors.password = 'La contraseña es obligatoria';
    } else if (formData.password && formData.password.length < 8) {
      errors.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePasswordForm = () => {
    const errors = {};

    if (!passwordData.newPassword) {
      errors.newPassword = 'La contraseña es obligatoria';
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'La contraseña debe tener al menos 8 caracteres';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const dataToSubmit = editingUser
        ? { username: formData.username, email: formData.email }
        : formData;

      if (editingUser) {
        await updateUser(editingUser.id, dataToSubmit);
      } else {
        await createUser(dataToSubmit);
      }
      setShowModal(false);
      setRequestVersion((version) => version + 1);
      setLoading(true);
    } catch (err) {
      setError(err.response?.data?.details?.[0] || 'Error al guardar el usuario');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!validatePasswordForm()) {
      return;
    }

    setSubmitting(true);
    try {
      await changeUserPassword(passwordUserId, passwordData.newPassword);
      setShowPasswordModal(false);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.details?.[0] || 'Error al cambiar la contraseña');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario?')) {
      return;
    }

    try {
      await deleteUser(id);
      setRequestVersion((version) => version + 1);
      setLoading(true);
    } catch (err) {
      setError(err.response?.data?.details?.[0] || 'Error al eliminar el usuario');
    }
  };

  const handlePageChange = (newPage) => {
    setLoading(true);
    setRequestVersion((version) => version + 1);
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Gestión de Usuarios</h1>
        <Button onClick={openCreateModal}>Nuevo Usuario</Button>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      <Card className={styles.filtersCard}>
        <form onSubmit={handleSearch} className={styles.filtersForm}>
          <Input
            name="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar usuarios..."
            className={styles.searchInput}
          />
          <select
            value={filters.sort}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
            className={styles.select}
          >
            <option value="username">Usuario</option>
            <option value="email">Correo</option>
          </select>
          <select
            value={filters.dir}
            onChange={(e) => handleFilterChange('dir', e.target.value)}
            className={styles.select}
          >
            <option value="asc">Ascendente</option>
            <option value="desc">Descendente</option>
          </select>
          <Button type="submit" variant="secondary">
            Buscar
          </Button>
        </form>
      </Card>

      {loading ? (
        <div className={styles.loading}>Cargando...</div>
      ) : users.length === 0 ? (
        <Card className={styles.empty}>
          <p className={styles.emptyText}>No hay usuarios para mostrar</p>
        </Card>
      ) : (
        <div className={styles.userList}>
          {users.map((user) => (
            <Card key={user.id} className={styles.userCard}>
              <div className={styles.userInfo}>
                <h3 className={styles.userName}>{user.username}</h3>
                <p className={styles.userEmail}>{user.email}</p>
              </div>
              <div className={styles.userActions}>
                <Button
                  variant="secondary"
                  onClick={() => openEditModal(user)}
                >
                  Editar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => openPasswordModal(user.id)}
                >
                  Cambiar Contraseña
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleDelete(user.id)}
                >
                  Eliminar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <Button
            variant="outline"
            disabled={pagination.page === 0}
            onClick={() => handlePageChange(pagination.page - 1)}
          >
            Anterior
          </Button>
          <span className={styles.pageInfo}>
            Página {pagination.page + 1} de {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={pagination.page >= pagination.totalPages - 1}
            onClick={() => handlePageChange(pagination.page + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
      >
        <form onSubmit={handleSubmit}>
          <Input
            label="Usuario"
            name="username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            placeholder="Nombre de usuario"
            error={formErrors.username}
          />
          <Input
            label="Correo Electrónico"
            type="email"
            name="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Correo electrónico"
            error={formErrors.email}
          />
          {!editingUser && (
            <Input
              label="Contraseña"
              type="password"
              name="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Contraseña (mínimo 8 caracteres)"
              error={formErrors.password}
            />
          )}
          <div className={styles.modalActions}>
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Guardando...' : editingUser ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Cambiar Contraseña"
      >
        <form onSubmit={handlePasswordSubmit}>
          <Input
            label="Nueva Contraseña"
            type="password"
            name="newPassword"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
            placeholder="Nueva contraseña (mínimo 8 caracteres)"
            error={formErrors.newPassword}
          />
          <div className={styles.modalActions}>
            <Button type="button" variant="secondary" onClick={() => setShowPasswordModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Guardando...' : 'Cambiar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Users;
