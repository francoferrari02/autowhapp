import React from 'react';

const TestPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Test Page</h1>
        <p>If you can see this, the routing is working!</p>
      </div>
    </div>
  );
};

export default TestPage; 