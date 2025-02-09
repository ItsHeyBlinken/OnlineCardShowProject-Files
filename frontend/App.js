import React from 'react';
import axios from 'axios';

function App() {
  const [message, setMessage] = React.useState('');

  React.useEffect(() => {
    axios.get('/api/profile') // Updated endpoint to match the backend
      .then(response => {
        setMessage(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the data!', error);
      });
  }, []);

  return (
    <div className="App">
      <h1>{message}</h1>
    </div>
  );
}

export default App;
