import { Routes, Route, Link, useLocation } from "react-router-dom";
import Merchant from "./pages/Merchant";
import Pay from "./pages/Pay";
import Dashboard from "./pages/Dashboard";

function App() {
  const location = useLocation();

  const getLinkClass = (path: string) => {
    return location.pathname === path
      ? "text-white font-bold"
      : "text-gray-400 hover:text-white";
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 p-4">
        <ul className="flex space-x-4">
          <li>
            <Link to="/merchant" className={getLinkClass("/merchant")}>
              Merchant
            </Link>
          </li>
          <li>
            <Link to="/pay" className={getLinkClass("/pay")}>
              Pay
            </Link>
          </li>
          <li>
            <Link to="/dashboard" className={getLinkClass("/dashboard")}>
              Dashboard
            </Link>
          </li>
        </ul>
      </nav>
      <main className="p-8">
        <Routes>
          <Route path="/merchant" element={<Merchant />} />
          <Route path="/pay" element={<Pay />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
