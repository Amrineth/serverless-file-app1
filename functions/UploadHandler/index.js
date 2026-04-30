const { BlobServiceClient } = require('@azure/storage-blob');
 
module.exports = async function (context, req) {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
 
  try {
    const { fileName, fileData } = req.body;
 
    if (!fileName || !fileData)
      return context.res = {
        status: 400, headers,
        body: JSON.stringify({ message: 'Missing fileName or fileData' })
      };
 
    const buffer = Buffer.from(fileData, 'base64');
    const blobClient = BlobServiceClient
      .fromConnectionString(process.env.STORAGE_CONN)
      .getContainerClient('uploads')
      .getBlockBlobClient(`${Date.now()}_${fileName}`);
 
    await blobClient.uploadData(buffer, {
      blobHTTPHeaders: { blobContentType: 'image/jpeg' }
    });
 
    context.log(`[INFO] Uploaded: ${fileName}`);
    context.res = {
      status: 200, headers,
      body: JSON.stringify({ message: `File received! AI analysis started for ${fileName}` })
    };
  } catch (err) {
    context.log.error('[ERROR]', err.message);
    context.res = { status: 500, headers, body: JSON.stringify({ message: err.message }) };
  }
};
 