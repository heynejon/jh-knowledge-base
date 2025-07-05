import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AllArticlesScreen from './screens/AllArticlesScreen';
import ItemViewScreen from './screens/ItemViewScreen';
import NewItemScreen from './screens/NewItemScreen';
import SettingsScreen from './screens/SettingsScreen';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<AllArticlesScreen />} />
          <Route path="/article/:id" element={<ItemViewScreen />} />
          <Route path="/new-item" element={<NewItemScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;