import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import SceneConfig from './components/SceneConfig';
import TaskExecution from './components/TaskExecution';
import EngineManagement from './components/EngineManagement';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/scene-config/:id?" element={<SceneConfig />} />
          <Route path="/task-execution" element={<TaskExecution />} />
          <Route path="/engine-management" element={<EngineManagement />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;