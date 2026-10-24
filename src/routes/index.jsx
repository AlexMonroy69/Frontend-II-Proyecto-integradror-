import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../hooks/useAuth.jsx';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import Login from '../pages/Login/Login';
import Register from '../pages/Register/Register';
import Dashboard from '../pages/Dashboard/Dashboard';
import ChangePassword from '../pages/ChangePassword/ChangePassword';
import Users from '../pages/Users/Users';
import Tasks from '../pages/Tasks/Tasks';
import NotFound from '../pages/NotFound/NotFound';
import Forbidden from '../pages/Forbidden/Forbidden';
import styles from './Routes.module.css';

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className={styles.app}>
          <Header />
          <main className={styles.main}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/account/password"
                element={
                  <ProtectedRoute>
                    <ChangePassword />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tasks"
                element={
                  <ProtectedRoute>
                    <Tasks />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute requireAdmin>
                    <Users />
                  </ProtectedRoute>
                }
              />
              <Route path="/forbidden" element={<Forbidden />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRoutes;
