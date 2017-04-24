const http = require('http');
const browserify = require('browserify');

const hostname = 'jasonhpriestley.com';
const port = 4444;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');
  res.write('<!doctype html><body style="background-color:black"><script type="text/javascript">')
  browserify('imperative.js').bundle()
    .on('end', () => res.end('</script>')).pipe(res, {end: false});
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
