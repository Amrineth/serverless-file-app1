const { CosmosClient } = require('@azure/cosmos');
const { EmailClient } = require('@azure/communication-email');
const ComputerVisionClient = require('@azure/cognitiveservices-computervision').ComputerVisionClient;
const ApiKeyCredentials = require('@azure/ms-rest-js').ApiKeyCredentials;
 
module.exports = async function (context, myBlob) {
  const blobName = context.bindingData.name;
  const blobUrl = `https://${process.env.STORAGE_ACCOUNT}.blob.core.windows.net/uploads/${blobName}`;
 
  context.log(`[INFO] Processing blob: ${blobName}`);
 
  // 1. Run Azure Computer Vision
  const creds = new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': process.env.VISION_KEY } });
  const vision = new ComputerVisionClient(creds, process.env.VISION_ENDPOINT);
  const result = await vision.analyzeImage(blobUrl, { visualFeatures: ['Tags', 'Description'] });
 
  const tags = result.tags.map(t => `${t.name} (${Math.round(t.confidence * 100)}%)`);
  const caption = result.description?.captions?.[0]?.text || 'No caption';
 
  context.log(`[INFO] Vision result: ${caption}`);
 
  // 2. Save to Cosmos DB
  const cosmos = new CosmosClient({ endpoint: process.env.COSMOS_ENDPOINT, key: process.env.COSMOS_KEY });
  await cosmos.database('FileAnalysisDB').container('Results').items.upsert({
    id: `${Date.now()}-${blobName}`,
    fileName: blobName,
    blobUrl,
    caption,
    tags,
    status: 'PROCESSED',
    timestamp: new Date().toISOString(),
  });
 
  context.log('[INFO] Saved to Cosmos DB');
 
  // 3. Send email via Azure Communication Services
  const emailClient = new EmailClient(process.env.COMM_CONN);
  await emailClient.beginSend({
    senderAddress: `DoNotReply@${process.env.COMM_DOMAIN}`,
    content: {
      subject: `File Analyzed: ${blobName}`,
      plainText: `Caption: ${caption}\nTop tags: ${tags.slice(0, 5).join(', ')}`,
    },
    recipients: { to: [{ address: process.env.NOTIFY_EMAIL }] },
  }).then(p => p.pollUntilDone());
 
  context.log('[INFO] Email sent');
};
 