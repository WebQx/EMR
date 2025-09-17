import React from 'react';
import ReactDOM from 'react-dom';
import PatientDashboard from '../components/PatientDashboard';

const App = () => {
  return (
    <PatientDashboard />
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
