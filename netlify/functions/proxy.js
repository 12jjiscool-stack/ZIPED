// netlify/functions/proxy.js
exports.handler = async function(event) {
  const qs = event.queryStringParameters || {};
  const url = (qs.url || '').trim();

  if (!url) {
    return {
      statusCode: 400,
      body: 'Missing url query parameter. Example: ?url=ziped://home'
    };
  }

  // Only allow our fake scheme
  if (!url.startsWith('ziped://')) {
    return {
      statusCode: 403,
      body: 'Forbidden: only ziped:// URLs are allowed in this demo.'
    };
  }

  // Extract path after scheme
  const path = url.replace('ziped://', '').replace(/^\/+/, '') || 'home';

  // Simple mock pages for the made-up "Ziped" service
  const pages = {
    home: `
      <html><head><meta charset="utf-8"><title>Ziped — Home</title></head>
      <body>
        <h1>Welcome to Ziped</h1>
        <p>This is the ZIPED demo homepage.</p>
        <nav>
          <a href="#" data-ziped="ziped://home">Home</a> |
          <a href="#" data-ziped="ziped://about">About</a> |
          <a href="#" data-ziped="ziped://gallery">Gallery</a> |
          <a href="#" data-ziped="ziped://contact">Contact</a>
        </nav>
        <div>
          <p>Try opening multiple tabs from the address bar or using the navigation links.</p>
        </div>
        <script>
          // When a link is clicked, tell parent to navigate that URL
          document.querySelectorAll('[data-ziped]').forEach(el=>{
            el.addEventListener('click', e=>{
              e.preventDefault();
              const u = el.getAttribute('data-ziped');
              parent.postMessage({ type: 'navigate', url: u }, '*');
            });
          });
        </script>
      </body></html>
    `,
    about: `
      <html><head><meta charset="utf-8"><title>Ziped — About</title></head>
      <body>
        <h1>About Ziped</h1>
        <p>Ziped is a playful demo web-service used to show a tabbed proxy UI on Netlify.</p>
        <nav>
          <a href="#" data-ziped="ziped://home">Home</a> |
          <a href="#" data-ziped="ziped://about">About</a> |
          <a href="#" data-ziped="ziped://gallery">Gallery</a>
        </nav>
        <script>
          document.querySelectorAll('[data-ziped]').forEach(el=>{
            el.addEventListener('click', e=>{
              e.preventDefault();
              parent.postMessage({ type: 'navigate', url: el.getAttribute('data-ziped') }, '*');
            });
          });
        </script>
      </body></html>
    `,
    gallery: `
      <html><head><meta charset="utf-8"><title>Ziped — Gallery</title></head>
      <body>
        <h1>Ziped Gallery</h1>
        <p>Sample images and layout.</p>
        <div style="display:flex;gap:12px;">
          <div style="width:160px;height:100px;border:1px solid #ddd;display:flex;align-items:center;justify-content:center">Image A</div>
          <div style="width:160px;height:100px;border:1px solid #ddd;display:flex;align-items:center;justify-content:center">Image B</div>
          <div style="width:160px;height:100px;border:1px solid #ddd;display:flex;align-items:center;justify-content:center">Image C</div>
        </div>
        <nav>
          <a href="#" data-ziped="ziped://home">Home</a> |
          <a href="#" data-ziped="ziped://about">About</a>
        </nav>
        <script>
          document.querySelectorAll('[data-ziped]').forEach(el=>{
            el.addEventListener('click', e=>{
              e.preventDefault();
              parent.postMessage({ type: 'navigate', url: el.getAttribute('data-ziped') }, '*');
            });
          });
        </script>
      </body></html>
    `,
    contact: `
      <html><head><meta charset="utf-8"><title>Ziped — Contact</title></head>
      <body>
        <h1>Contact Ziped</h1>
        <p>Email: hello@ziped.example</p>
        <nav><a href="#" data-ziped="ziped://home">Home</a></nav>
        <script>
          document.querySelectorAll('[data-ziped]').forEach(el=>{
            el.addEventListener('click', e=>{
              e.preventDefault();
              parent.postMessage({ type: 'navigate', url: el.getAttribute('data-ziped') }, '*');
            });
          });
        </script>
      </body></html>
    `
  };

  const body = pages[path] || `<html><body><h1>404 — ${path}</h1><p>Route not found.</p><script>parent.postMessage({type:'notfound', url:'ziped://${path}'}, '*');</script></body></html>`;

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html' },
    body
  };
};
