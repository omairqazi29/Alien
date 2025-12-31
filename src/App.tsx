import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { CriteriaDetail } from './pages/CriteriaDetail';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/criteria/:id" element={<CriteriaDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
