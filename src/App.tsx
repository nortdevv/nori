import { BrowserRouter, Routes, Route } from "react-router-dom";
import Proyectos from "./pages/Proyectos";
import CrearProyecto from "./pages/CrearProyecto";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Proyectos />} />
        <Route path="/proyectos" element={<Proyectos />} />
        <Route path="/proyectos/crear" element={<CrearProyecto />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
