import { Routes, Route, Navigate } from 'react-router-dom';
import Gateway from './pages/Gateway.jsx';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ViewPage from './pages/ViewPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Gateway />} />
      <Route path="/:role" element={<Layout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path=":view" element={<ViewPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
