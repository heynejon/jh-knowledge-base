import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { articleApi, Article } from '../utils/api';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';

const ItemViewScreen: React.FC = () => {
  console.log('ItemViewScreen rendering');
  
  // Temporary minimal test
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8">
        <h1 className="text-2xl font-bold">Test - ItemViewScreen is rendering</h1>
        <p>If you see this, the component is working</p>
      </div>
    </div>
  );
};

export default ItemViewScreen;