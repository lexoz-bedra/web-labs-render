const http = require('http');
const zlib = require('zlib');

function parseMultipart(buffer, contentType) {
  const boundaryMatch = contentType.match(/boundary=(.+)$/);
  if (!boundaryMatch) return null;
  const boundary = Buffer.from('--' + boundaryMatch[1]);

  let start = buffer.indexOf(boundary);
  while (start !== -1) {
    const nextBoundary = buffer.indexOf(boundary, start + boundary.length);
    const partEnd = nextBoundary === -1 ? buffer.length : nextBoundary;
    const part = buffer.slice(start + boundary.length, partEnd);

    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd !== -1) {
      const headers = part.slice(0, headerEnd).toString('utf8');
      if (headers.includes('filename=')) {
        let body = part.slice(headerEnd + 4);
        if (body.slice(-2).toString() === '\r\n') {
          body = body.slice(0, -2);
        }
        return body;
      }
    }
    start = nextBoundary;
  }
  return null;
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const url = req.url;

  if (url === '/login' || url === '/login/') {
    res.setHeader('Content-Type', 'text/plain');
    res.writeHead(200);
    res.end('lexoz_bedra');

  } else if (url === '/zipper' || url === '/zipper/') {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      const fileBuffer = parseMultipart(buffer, req.headers['content-type'] || '');
      if (!fileBuffer) {
        res.writeHead(400);
        res.end('No file found');
        return;
      }
      zlib.gzip(fileBuffer, (err, compressed) => {
        if (err) {
          res.writeHead(500);
          res.end('Compression error');
          return;
        }
        res.setHeader('Content-Type', 'application/gzip');
        res.writeHead(200);
        res.end(compressed);
      });
    });
    return;

  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(process.env.PORT || 3004, () => console.log('Running'));