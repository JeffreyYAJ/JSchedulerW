
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import StudentManagement from "./pages/StudentManagement";
import CreateSession from "./pages/CreateSession";

function App() {
  return (
  <Router>
      <Routes>
        <Route path="/student" element={<StudentManagement />} />
        <Route path="/create_session" element={<CreateSession />} />
      </Routes>
    </Router>
  );

}

export default App;
