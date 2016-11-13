#!/usr/bin/env node

const uuid = require('uuid');
const request = require('request');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());

const PORT = parseInt(process.argv[2]) || 32000;
const POLL_INTERVAL = parseInt(process.argv[3]) || 10 * 1000;
const THRESHOLD = parseInt(process.argv[4]) || 4 * 1000;

let instances = {};

// Client Creation: Get a list of all instances
app.get('/services', (req, res) => {
  console.log('GET /services');
  res.status(200).json(instances);
});

// Client appears: Add service to list
app.post('/services/:service_name', (req, res) => {
  let service_name = req.params.service_name;
  let host = req.body.host;
  let port = parseInt(req.body.port || 80);

  console.log(`GET /services/${service_name}`);

  if (!host || !port) {
    return res.status(400).json({error: 'must_provide_host_port'});
  }

  let instance = addInstance(service_name, host, port);

  console.log(`Client registering as ${service_name}/${instance.id} @ ${host}:${port}`);

  res.status(202).json(instance);
});

// Client goes away: Remove instance ID from list
app.delete('/services/:service_name/:instance_id', (req, res) => {
  let service_name = req.params.service_name;
  let instance_id = req.params.instance_id;

  console.log(`DELETE /services/${service_name}/${instance_id}`);

  let instance = removeInstance(service_name, instance_id);

  if (instance) {
    console.log(`Client de-registering as ${service_name}/${instance_id} @ ${instance.host}:${instance.port}`);
    return res.status(200).json(instance);
  }

  res.status(404).json({error: 'instance_not_found'});
});

app.listen(PORT, (err) => {
  console.log('listening');
});

// Check health of each registered service
setInterval(() => {
  Object.keys(instances).forEach((service_name) => {
    instances[service_name].forEach((instance) => {
      checkHealth(instance.host, instance.port, (err, alive) => {
        if (alive) return;
        console.error(`Instance failed health check! ${service_name}/${instance.id}`);
        removeInstance(service_name, instance.id);
      });
    });
  });
}, POLL_INTERVAL);

function createCollection(name) {
  if (!instances[name]) {
    instances[name] = [];
  }
}

function addInstance(name, host, port) {
  createCollection(name);

  let id = uuid.v4();
  let instance = { id, host, port };

  instances[name].push(instance);

  return instance;
}

function removeInstance(name, id) {
  let instance = false;

  if (!instances[name]) {
    return instance;
  }

  for (let i = 0; i < instances[name].length; i++) {
    if (instances[name][i].id === id) {
      instance = instances[name].splice(i, 1);
      break;
    }
  }

  if (!instances[name].length) {
    delete instances[name];
  }

  return instance;
}

function checkHealth(host, port, callback) {
  let url = `http://${host}:${port}/health`;

  request(url, {timeout: THRESHOLD}, (err, response) => {
    if (err || response.statusCode >= 400) {
      return callback(null, false);
    }

    callback(null, true);
  });
}
