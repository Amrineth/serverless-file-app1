// Replace with your APIM Gateway URL after Phase 4
const API_URL = "https://fileapp-apim.azure-api.net";
 
function updateLabel(input) {
  document.getElementById('fileLabel').textContent =
    input.files[0] ? input.files[0].name : 'Click to choose an image...';
}
 
async function uploadFile() {
  const file = document.getElementById('fileInput').files[0];
  const result = document.getElementById('result');
  const btn = document.getElementById('btn');
 
  if (!file) { result.textContent = 'Please select a file first.'; return; }
  result.className = '';
  result.textContent = 'Uploading and analyzing...';
  btn.disabled = true;
 
  try {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1];
      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileData: base64 })
      });
      const data = await res.json();
      result.textContent = data.message;
    };
    reader.readAsDataURL(file);
  } catch (err) {
    result.className = 'error';
    result.textContent = 'Error: ' + err.message;
  } finally {
    btn.disabled = false;
  }
}
 