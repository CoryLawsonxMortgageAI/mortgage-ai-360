import { performOCR } from './server/ocr';

async function test() {
  try {
    const result = await performOCR('/home/ubuntu/upload/duma4111_23i_FC.pdf');
    console.log('Document Type:', result.documentType);
    console.log('Confidence:', result.confidence);
    console.log('Extracted Fields:', JSON.stringify(result.extractedFields, null, 2));
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

test();
