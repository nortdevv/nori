import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Proyectos from "./pages/Proyectos";
import CrearProyecto from "./pages/CrearProyecto";
import DetalleProyecto from "./pages/DetalleProyecto";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Proyectos />} />
        <Route path="/detalle" element={<DetalleProyecto />} />
        <Route path="/detalle/crear" element={<CrearProyecto />} />
        <Route path="/detalle/proyecto" element={<Proyectos />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
