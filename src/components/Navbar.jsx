import { useState } from "react";
import { Link } from "react-router-dom";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 px-8 py-3 shadow-sm">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        
        {/* Logo à gauche */}
        <div className="text-xl md:text-2xl font-bold text-gray-900">
          <Link to="/Home" className="text-sky-900 font-bold"> AutomateSimul </Link>
        </div>

        {/* Menu Desktop */}
        <div className="hidden md:flex space-x-8 items-center">
          {["Automate", "Clôture", "Équations"].map((item) => (
            <Link
              key={item}
              to={`/${item.toLowerCase()}`}
              className="relative text-gray-700 font-bold hover:text-black"
            >
              {item}
              <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-black transition-all duration-300 group-hover:w-full hover:w-full"></span>
            </Link>
            
          ))}
        </div>

        {/* Menu Hamburger Mobile */}
        <div className="md:hidden">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-gray-800 focus:outline-none"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Menu Mobile */}
      {menuOpen && (
        <div className="md:hidden mt-2 space-y-2 px-2">
          {["Automate", "Clôture", "Équations"].map((item) => (
            <Link
              key={item}
              to={`/${item.toLowerCase()}`}
              className="block text-gray-700 font-medium px-2 py-1 rounded hover:bg-black hover:text-white transition"
            >
              {item}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

export default Navbar;
