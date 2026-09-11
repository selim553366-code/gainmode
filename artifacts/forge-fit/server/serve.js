/**
 * Standalone production server for Expo static builds.
 *
 * Serves the output of build.js (static-build/) with two special routes:
 * - GET / or /manifest with expo-platform header → platform manifest JSON
 * - GET / without expo-platform → landing page HTML
 * Everything else falls through to static file serving from ./static-build/.
 *
 * Zero external dependencies — uses only Node.js built-ins (http, fs, path).
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const readFileDescriptor = fs.readSync;
const { renderPrivacyPolicyPage } = require('./privacyPolicy');
const { renderAccountDeletionPage } = require('./accountDeletion');

const STATIC_ROOT = path.resolve(__dirname, '..', 'static-build');
const TEMPLATE_PATH = path.resolve(__dirname, 'templates', 'landing-page.html');
const basePath = (process.env.BASE_PATH || '/').replace(/\/+$/, '');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.map': 'application/json',
};

function getAppName() {
  try {
    const appJsonPath = path.resolve(__dirname, '..', 'app.json');
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
    return typeof appJson.expo?.name === 'string'
      ? appJson.expo.name
      : 'App Landing Page';
  } catch {
    return 'App Landing Page';
  }
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function toScriptString(value) {
  return JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026');
}

function serveManifest(platform, res) {
  const manifestPath = platform === 'ios'
    ? path.join(STATIC_ROOT, 'ios', 'manifest.json')
    : path.join(STATIC_ROOT, 'android', 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(
      JSON.stringify({ error: `Manifest not found for platform: ${platform}` }),
    );
    return;
  }

  const manifest = fs.readFileSync(manifestPath, 'utf-8');
  res.writeHead(200, {
    'content-type': 'application/json',
    'expo-protocol-version': '1',
    'expo-sfv-version': '0',
  });
  res.end(manifest);
}

function serveLandingPage(req, res, landingPageTemplate, appName) {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const protocol = forwardedProto || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers['host'];
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `exps://${host}${basePath}`;

  const html = landingPageTemplate
    .replace(/BASE_URL_PLACEHOLDER/g, baseUrl)
    .replace(/EXPS_URL_ATTRIBUTE_PLACEHOLDER/g, escapeHtml(expsUrl))
    .replace(/EXPS_URL_JSON_PLACEHOLDER/g, toScriptString(expsUrl))
    .replace(/APP_NAME_PLACEHOLDER/g, escapeHtml(appName));

  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(html);
}

function buildStaticFileIndex(rootDir) {
  const index = new Map();
  if (!fs.existsSync(rootDir)) return index;

  function visit(directory, urlPrefix) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const diskPath = path.join(directory, entry.name);
      const urlPath = `${urlPrefix}/${entry.name}`;
      if (entry.isDirectory()) {
        visit(diskPath, urlPath);
        continue;
      }
      if (!entry.isFile()) continue;
      const realPath = fs.realpathSync(diskPath);
      const relativePath = path.relative(rootDir, realPath);
      if (!relativePath.startsWith('..') && !path.isAbsolute(relativePath)) {
        try {
          index.set(urlPath, { filePath: realPath, fileDescriptor: fs.openSync(realPath, 'r') });
        } catch {
          // Skip files that cannot be opened safely.
        }
      }
    }
  }

  visit(rootDir, '');
  return index;
}

function serveStaticFile(urlPath, res) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(urlPath);
  } catch {
    res.writeHead(400);
    res.end('Bad Request');
    return;
  }
  const segments = decodedPath.replace(/^[/\\]+/, '').split(/[\\/]+/);
  if (
    segments.some((segment) => !segment || segment === '.' || segment === '..' || segment.includes('\0'))
  ) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  const staticFile = staticFileIndex.get(`/${segments.join('/')}`);

  if (!staticFile) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  const ext = path.extname(staticFile.filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const fileSize = fs.fstatSync(staticFile.fileDescriptor).size;
  const content = Buffer.alloc(fileSize);
  readFileDescriptor(staticFile.fileDescriptor, content, 0, fileSize, 0);
  res.writeHead(200, { 'content-type': contentType });
  res.end(content);
}

const landingPageTemplate = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
const appName = getAppName();
const staticFileIndex = buildStaticFileIndex(STATIC_ROOT);

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  let pathname = url.pathname;

  if (basePath && pathname.startsWith(basePath)) {
    pathname = pathname.slice(basePath.length) || '/';
  }

  if (pathname === '/' || pathname === '/manifest') {
    const platform = req.headers['expo-platform'];
    if (platform === 'ios' || platform === 'android') {
      return serveManifest(platform, res);
    }

    if (pathname === '/') {
      return serveLandingPage(req, res, landingPageTemplate, appName);
    }
  }

  if (pathname === '/privacy-policy' || pathname === '/privacy') {
    const requestedLanguage = url.searchParams.get('lang');
    const browserLanguage = (req.headers['accept-language'] || '').split(',')[0].split('-')[0];
    const language = requestedLanguage || browserLanguage || 'en';
    const html = renderPrivacyPolicyPage(language, basePath);
    res.writeHead(200, {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=300',
    });
    res.end(html);
    return;
  }

  if (pathname === '/delete-account' || pathname === '/account-deletion') {
    const requestedLanguage = url.searchParams.get('lang');
    const browserLanguage = (req.headers['accept-language'] || '').split(',')[0].split('-')[0];
    const language = requestedLanguage || browserLanguage || 'en';
    const html = renderAccountDeletionPage(language, basePath);
    res.writeHead(200, {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=300',
    });
    res.end(html);
    return;
  }

  serveStaticFile(pathname, res);
});

const port = parseInt(process.env.PORT || '3000', 10);
server.listen(port, '0.0.0.0', () => {
  console.log(`Serving static Expo build on port ${port}`);
});
