# node-discovery

Rudimentary NodeJS Discovery service for illustration purposes.
This project will accompany a book I'm currently writing.

## Usage

### Server
```shell
# ./server.js <port> <poll_timer>
./server.js 2000 10000
```

### Clients

```shell
# ./client-provider.js <port>
./client-provider.js 2000 # Ctrl+C later
./client-provider.js 2000

# ./client-consumer.js <port>
./client-consumer.js 2000
```
