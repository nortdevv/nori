import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";
import CrearProyecto from "./pages/CrearProyecto";
import DetalleProyecto from "./pages/DetalleProyecto";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/:id" element={<DetalleProyecto />} />
        <Route path="/crear" element={<CrearProyecto />} />
        <Route path="/detalle/proyecto" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
