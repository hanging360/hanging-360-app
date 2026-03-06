import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomeScreen from "./screens/HomeScreen";
import NotFoundScreen from "./screens/NotFoundScreen";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="*" element={<NotFoundScreen />} />
      </Routes>
    </BrowserRouter>
  );
}
