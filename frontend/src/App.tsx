import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Merchant from "./pages/Merchant";
import Pay from "./pages/Pay";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white">
        <nav className="bg-gray-800 p-4">
          <ul className="flex space-x-4">
            <li>
              <Link to="/merchant" className="hover:text-gray-300">
                Merchant
              </Link>
            </li>
            <li>
              <Link to="/pay" className="hover:text-gray-300">
                Pay
              </Link>
            </li>
            <li>
              <Link to="/dashboard" className="hover:text-gray-300">
                Dashboard
              </Link>
            </li>
          </ul>
        </nav>
        <main className="p-8">
          <Routes>
            <Route path="/merchant" element={<Merchant />} />
            <Route path="/pay" element={<Pay />} />
            <Route path="/dashboard" element={<div>Dashboard Page</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
