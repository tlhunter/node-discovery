#!/usr/bin/env node

const request = require('request');
const express = require('express');
const app = express();

const CLIENT_PORT = parseInt(process.argv[2]);
const DISCOVERY = `http://${process.argv[3]}`;
const HOSTNAME = require('os').hostname();

const SERVICE_NAME = 'random_number';
let instance_id = null;

app.get('/health', (req, res) => {
  console.log('GET /health');
  res.status(200).send('ok');
});

app.get('/data', (req, res) => {
  console.log('GET /data');
  res.status(200).json({
    data: Math.floor(Math.random() * 899999 + 100000),
    debug: {
      pid: process.pid,
      discovery: instance_id
    }
  });
});

register((err, id) => {
  if (err) {
    console.error("Unable to register. Is discovery server running?");
    process.exit(1);
  }

  instance_id = id;

  console.log(`registered as ${SERVICE_NAME}/${id}.`);

  listen();
});

function listen() {
  app.listen(CLIENT_PORT, (err) => {
    console.log('listening');
  });
}

function register(callback) {
  console.log(`registering as ${HOSTNAME}:${CLIENT_PORT}...`);
  request.post({
    url: `${DISCOVERY}/services/${SERVICE_NAME}`,
    json: true,
    body: {
      port: CLIENT_PORT,
      host: HOSTNAME
    }
  }, (err, data) => {
    if (err || !data) {
      return callback(err || true);
    }

    callback(null, data.body.id);
  });
}

function deregister(callback) {
  request.delete(
    `${DISCOVERY}/services/${SERVICE_NAME}/${instance_id}`,
    callback
  );
}

process.on('SIGINT', () => {
  console.log('SIGINT, de-registering...');

  deregister(() => {
    console.log('exiting');
    process.exit();
  });
});
