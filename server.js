#!/usr/bin/env node

const http = require('http');

const POLL_INTERVAL = 10 * 1000;
const PORT = 32000;

let instances = {};

let server = http.createServer((req, res) => {
  console.log(req.method, req.url);

  if (req.method === 'get' && req.url === '/') {
    // Get entire state of discovery
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(instances));
  } else if (req.method === 'post' && req.url.match(/\/services\/([a-zA-Z0-9-_]+)\/?/)) {
    // Create a new discovery instance
    let name; // grab name from URL
    let body; // grab body from request
    let data = addInstance(name, body.host, body.port);

    res.writeHead(202, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(instance));
  } else if (req.method === 'delete' && req.url.match(/\/services\/([a-zA-Z0-9-_]+)\/([a-fA-F0-9-]+)/)) {
  // Destroy a discovery instance
    let name;
    let id;

    let instance = removeInstance(name, id);

    if (instance) {
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify(instance));
    }

    res.writeHead(404, {'Content-Type': 'application/json'});
    res.end('{"error": "no_instances_found"}');
  } else {
    res.writeHead(404, {'Content-Type': 'application/json'});
    res.end('{"error": "invalid_operation"}');
  }
});

// Make requests to services
setInterval(() => {
  for (let types of instances) {
    for (let instance of types) {
      // make request to `http://{instance.host}:{instance.port}/health`;
      // have a POLL_INTERVAL/2 timeout
      // remove from list if timeout or status code isn't >= 200 && < 300
    }
  }
}, POLL_INTERVAL);

function createCollection(name) {
  if (!instances[name]) {
    instances[name] = {};
  }
}

function addInstance(name, host, port) {
  createCollection(name);

  let id = uuid();

  let instance = {
    id: id,
    host: host,
    port: port
  };

  instances[name] = instance;

  return instance;
}

function removeInstance(name, id) {
  if (!instances[name]) {
    return false;
  }

  for (let i = 0; i < instances[name].length; i++) {
    if (instances[name][i].id === id) {
      return instances[name].splice(i, 0);
    }
  }

  return false;
}

server.listen(PORT);

function uuid() {
  function s4() { return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1); }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}
