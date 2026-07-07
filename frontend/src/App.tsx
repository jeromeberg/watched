import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CollectionsPage } from './pages/CollectionsPage';
import { CollectionDetailPage } from './pages/CollectionDetailPage';
import { DetailPage } from './pages/DetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { TitlesPage } from './pages/TitlesPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/movies"
            element={
              <ProtectedRoute>
                <TitlesPage type="movie" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shows"
            element={
              <ProtectedRoute>
                <TitlesPage type="show" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/movies/:id"
            element={
              <ProtectedRoute>
                <DetailPage type="movie" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shows/:id"
            element={
              <ProtectedRoute>
                <DetailPage type="show" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/collections"
            element={
              <ProtectedRoute>
                <CollectionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/collections/:id"
            element={
              <ProtectedRoute>
                <CollectionDetailPage />
              </ProtectedRoute>
            }
          />
          <Route path="/u/:username" element={<ProfilePage />} />
          <Route path="/u/:username/movies" element={<TitlesPage type="movie" />} />
          <Route path="/u/:username/shows" element={<TitlesPage type="show" />} />
          <Route path="/u/:username/movies/:id" element={<DetailPage type="movie" />} />
          <Route path="/u/:username/shows/:id" element={<DetailPage type="show" />} />
          <Route path="/u/:username/collections/:id" element={<CollectionDetailPage />} />
          <Route path="*" element={<Navigate to="/movies" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
