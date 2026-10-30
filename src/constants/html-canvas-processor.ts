export const htmlCanvasProcessor = `
  <!DOCTYPE html>
  <html>
    <body style="margin:0; padding:0;">
      <canvas id="c"></canvas>
      <script>
        function processImage(base64Data) {
          const img = new Image();
          img.onload = function() {
            const canvas = document.getElementById('c');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const cx = Math.floor(img.width / 2);
            const cy = Math.floor(img.height / 2);
            const p = ctx.getImageData(cx, cy, 1, 1).data;
            const hex = "#" + ((1 << 24) + (p[0] << 16) + (p[1] << 8) + p[2]).toString(16).slice(1).toUpperCase();

            window.ReactNativeWebView.postMessage(JSON.stringify({ hex: hex }));
          };
          img.src = 'data:image/jpeg;base64,' + base64Data;
        }

        function handleMessage(e) {
          try {
            const data = JSON.parse(e.data);
            if (data.base64) processImage(data.base64);
          } catch(err) {}
        }

        document.addEventListener('message', handleMessage);
        window.addEventListener('message', handleMessage);
      </script>
    </body>
  </html>
`;
