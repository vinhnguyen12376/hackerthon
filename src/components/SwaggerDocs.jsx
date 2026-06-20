import React from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

const SwaggerDocs = () => {
  return (
    <div style={{ backgroundColor: '#ffffff', height: '100%', overflowY: 'auto', padding: '20px', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>
        Tài liệu API Hệ thống AI Agents (Virtual Endpoints)
      </h2>
      <SwaggerUI url="/openapi.yaml" />
    </div>
  );
};

export default SwaggerDocs;
