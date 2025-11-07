const axios = require('axios');
const SERVER = 'http://localhost:4000';

function makeEvent() {
  return {
    ts: new Date(),
    route: ['/home', '/login', '/search'][Math.floor(Math.random() * 3)],
    status: Math.random() < 0.1 ? 500 : 200
  };
}

async function sendEvent() {
  try {
    await axios.post(`${SERVER}/ingest`, makeEvent());
    console.log('Event sent');
  } catch (e) {
    console.error('Error sending event', e.message);
  }
}

setInterval(sendEvent, 1000); // 1 per second
