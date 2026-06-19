const http = require('http');
const zlib = require('zlib');

function parseMultipart(buffer, contentType) {
  const boundaryMatch = contentType.match(/boundary=(.+)$/);
  if (!boundaryMatch) return null;
  const boundary = '--' + boundaryMatch[1];
  const parts = buffer.toString('binary').split(boundary);

  for (const part of parts) {
    if (part.includes('filename=')) {
      const headerEnd = part.indexOf('\r\n\r\n');
      if (headerEnd === -1) continue;
      let body = part.slice(headerEnd + 4);
      body = body.replace(/\r\n--$/, '').replace(/\r\n$/, '');
      return Buffer.from(body, 'binary');
    }
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
        res.setHeader('Content-Disposition', 'attachment; filename="result.gz"');
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

