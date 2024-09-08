import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UploadPage from './components/UploadPage';
import NotFound from './components/NotFound';
import SimpleBarChart from './components/SimpleBarChart';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="*" element={<NotFound />} />
        <Route path="/bar-chart" element={<SimpleBarChart />} />
      </Routes>
    </Router>
  );
}

export default App;
