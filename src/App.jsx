import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Control from './pages/Control';
import Automation from './pages/Automation';

function App() {
  return (
    <Router>
      <div className="flex flex-col h-screen bg-gray-50 font-sans">
        
        {/* Màn hình hiển thị chính */}
        <main className="flex-1 overflow-y-auto p-4 pb-20">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/control" element={<Control />} />
            <Route path="/automation" element={<Automation />} />
          </Routes>
        </main>

        {/* Thanh điều hướng Fat-Finger cho nhà nông */}
        <nav className="fixed bottom-0 w-full bg-white border-t-2 border-gray-200 flex justify-around p-3 shadow-lg z-50">
          <Link to="/" className="flex flex-col items-center text-gray-600 hover:text-green-600">
            <span className="text-2xl">📊</span>
            <span className="text-xs font-bold mt-1">Tổng Quan</span>
          </Link>
          <Link to="/control" className="flex flex-col items-center text-gray-600 hover:text-green-600">
            <span className="text-2xl">⚡</span>
            <span className="text-xs font-bold mt-1">Điều Khiển</span>
          </Link>
          <Link to="/automation" className="flex flex-col items-center text-gray-600 hover:text-green-600">
            <span className="text-2xl">⚙️</span>
            <span className="text-xs font-bold mt-1">Tự Động</span>
          </Link>
        </nav>

      </div>
    </Router>
  );
}

export default App;