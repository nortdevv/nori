import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import CrearProyecto from "./pages/CrearProyecto";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/proyectos" element={<Home />} />
        <Route path="/proyectos/crear" element={<CrearProyecto />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
