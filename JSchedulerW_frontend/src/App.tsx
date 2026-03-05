
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import StudentManagement from "./pages/StudentManagement";

function App() {
  return (
  <Router>
      <Routes>
        <Route path="/student" element={<StudentManagement />} />
      </Routes>
    </Router>
  );

}

export default App;
