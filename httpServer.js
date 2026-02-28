const http = require("http");

const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("This is basic HTTP server");
});

server.listen(4000, () => {
    console.log("HTTP Server running on http://localhost:4000");
});