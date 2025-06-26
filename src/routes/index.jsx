// src/routes/index.jsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

import Home from '../Pages/Home'
import EquationsSolver from '../Pages/EquationsSolver'
import Operations from '../Pages/Operations'
import Automate from '../Pages/Automate'
import Welcome from '../Pages/Welcome'

export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/home" element={<Home />} />
        <Route path="/équations" element={<EquationsSolver />} />
        <Route path="/clôture" element={<Operations />} />
        <Route path="/automate" element={<Automate />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}
