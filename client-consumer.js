#!/usr/bin/env node

const request = require('request');

const DISCOVERY = `http://${process.argv[2]}`;
const SERVICE_NAME = 'random_number';

let discovery = null;

// Get discovery updates every four seconds
getDiscovery();
setInterval(getDiscovery, 4 * 1000);

setTimeout(doWork, 3 * 1000 + Math.random(3 * 1000));
function doWork() {
  let url = `${getRandomService()}/data`;
  request(url, {json: true}, (err, data) => {
    if (err) {
      return console.log('error getting data', err);
    }

    console.log('random number', data.body.data, 'url', url);
  });
  setTimeout(doWork, 3 * 1000 + Math.random(3 * 1000));
}

function getDiscovery() {
  console.log('discovery lookup');

  request.get(`${DISCOVERY}/services`, {json: true}, (err, data) => {
    if (err) {
      return console.error('unable to get discovery status', err);
    }

    console.log('got data');

    discovery = data.body;
  });
}

function getRandomService() {
  let pool = discovery[SERVICE_NAME];

  let url = pool[Math.floor(Math.random() * pool.length)];

  return `http://${url.host}:${url.port}`;
}
