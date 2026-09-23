import dns from 'dns';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import http from 'http';
import app from '../app.js';
import { getImageBucket, getAttachmentBucket, deleteFileFromGridFS } from '../config/gridfs.js';
import { Image } from '../models/Image.js';
import { Inquiry } from '../models/Inquiry.js';

dotenv.config();

// Ensure Google & Cloudflare DNS for local Windows resolution if needed
if (process.platform === 'win32') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (e) {
    // Ignore if not supported
  }
}

const runVerification = async () => {
  console.log('\n========================================================');
  console.log('       MONGODB GRIDFS ENDPOINT VERIFICATION SUITE       ');
  console.log('========================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  const assert = (condition, message) => {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✓ PASS: ${message}`);
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  };

  let server;
  let baseUrl;

  try {
    // Step 1: Connect to database
    console.log('[1/7] Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
    });
    const imageBucket = getImageBucket();
    const attachmentBucket = getAttachmentBucket();
    console.log('  ✓ Connected to MongoDB and initialized GridFS buckets.');

    // Clean up any test artifacts from prior runs
    const staleTestImages = await Image.find({ filename: 'test-pixel.png' });
    for (const stale of staleTestImages) {
      if (stale.fileId) await deleteFileFromGridFS(imageBucket, stale.fileId);
      await Image.deleteOne({ _id: stale._id });
    }

    // Step 2: Verify current database inventory
    console.log('\n[2/7] Checking Database Inventory...');
    const imageDocCount = await Image.countDocuments();
    const imageFilesCount = await mongoose.connection.db.collection('image_files.files').countDocuments();
    const imageChunksCount = await mongoose.connection.db.collection('image_files.chunks').countDocuments();
    const attachmentFilesCount = await mongoose.connection.db.collection('attachment_files.files').countDocuments();

    console.log(`  - Images metadata documents: ${imageDocCount}`);
    console.log(`  - GridFS image files:        ${imageFilesCount}`);
    console.log(`  - GridFS image chunks:       ${imageChunksCount}`);
    console.log(`  - GridFS attachment files:   ${attachmentFilesCount}`);

    assert(imageDocCount > 0, `Images collection has records (found ${imageDocCount})`);
    assert(imageFilesCount === imageDocCount, `image_files.files count (${imageFilesCount}) matches Image docs count (${imageDocCount})`);
    assert(imageChunksCount >= imageFilesCount, `image_files.chunks count (${imageChunksCount}) >= files count (${imageFilesCount})`);

    // Step 3: Start ephemeral test server
    console.log('\n[3/7] Starting Local Server on ephemeral port...');
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
    console.log(`  ✓ Test server listening at ${baseUrl}`);

    // Step 4: Test GET /api/images/:id and ETag / 304 caching
    console.log('\n[4/7] Testing Image Streaming & Caching (GET /api/images/:id)...');
    const sampleImage = await Image.findOne();
    assert(!!sampleImage, 'Sample image found for streaming test');

    const res = await fetch(`${baseUrl}/api/images/${sampleImage._id}`);
    assert(res.status === 200, `GET /api/images/${sampleImage._id} returned HTTP 200`);
    assert(res.headers.get('content-type') === sampleImage.contentType, `Content-Type matches: ${res.headers.get('content-type')}`);
    assert(res.headers.get('cache-control')?.includes('immutable'), `Cache-Control includes immutable: ${res.headers.get('cache-control')}`);
    
    const etag = res.headers.get('etag');
    assert(!!etag, `ETag header present: ${etag}`);

    const buffer = await res.arrayBuffer();
    assert(buffer.byteLength === sampleImage.size, `Streamed byte size (${buffer.byteLength}) matches metadata size (${sampleImage.size})`);

    // Conditional request with If-None-Match
    const cachedRes = await fetch(`${baseUrl}/api/images/${sampleImage._id}`, {
      headers: { 'If-None-Match': etag },
    });
    assert(cachedRes.status === 304, `Conditional GET with If-None-Match returned HTTP 304 Not Modified`);
    const emptyBody = await cachedRes.arrayBuffer();
    assert(emptyBody.byteLength === 0, `HTTP 304 response body is empty`);

    // Test 404 and 400
    const nonExistentId = new mongoose.Types.ObjectId();
    const notFoundRes = await fetch(`${baseUrl}/api/images/${nonExistentId}`);
    assert(notFoundRes.status === 404, `GET nonexistent ObjectId returned HTTP 404`);

    const badIdRes = await fetch(`${baseUrl}/api/images/invalid-id-format`);
    assert(badIdRes.status === 404, `GET malformed ObjectId returned HTTP 404`);

    // Step 5: Test Inquiry Attachment Streaming (GET /api/contact/attachment/:id)
    console.log('\n[5/7] Testing Attachment Streaming (GET /api/contact/attachment/:id)...');
    const attachFile = await mongoose.connection.db.collection('attachment_files.files').findOne();
    if (attachFile) {
      const attachRes = await fetch(`${baseUrl}/api/contact/attachment/${attachFile._id}`);
      assert(attachRes.status === 200, `GET /api/contact/attachment/${attachFile._id} returned HTTP 200`);
      assert(attachRes.headers.get('content-disposition')?.includes('inline'), `Content-Disposition header includes inline`);
      const attachBuffer = await attachRes.arrayBuffer();
      assert(attachBuffer.byteLength === attachFile.length, `Attachment streamed byte size (${attachBuffer.byteLength}) matches GridFS file length (${attachFile.length})`);
    } else {
      console.log('  ℹ No attachment found in attachment_files bucket.');
    }

    // Step 6: Test Image Upload (POST /api/upload/image)
    console.log('\n[6/7] Testing Upload & Validation (POST /api/upload/image)...');
    
    // 6a: Test unauthenticated upload -> 401
    const unauthRes = await fetch(`${baseUrl}/api/upload/image`, {
      method: 'POST',
    });
    assert(unauthRes.status === 401, `Unauthenticated POST /api/upload/image returned HTTP 401`);

    // 6b: Create valid admin JWT
    const jwtSecret = process.env.JWT_SECRET || 'zubyte_jwt_super_secret_production_key_2026_x99!';
    const adminToken = jwt.sign(
      { id: new mongoose.Types.ObjectId().toString(), username: 'admin_tester', role: 'admin' },
      jwtSecret,
      { expiresIn: '1h' }
    );

    // 6c: Test upload with valid 1x1 PNG
    // Minimal valid 1x1 PNG bytes
    const validPngBytes = Buffer.from(
      '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63600000000200014e2d312e0000000049454e44ae426082',
      'hex'
    );

    const formData = new FormData();
    const blob = new Blob([validPngBytes], { type: 'image/png' });
    formData.append('image', blob, 'test-pixel.png');
    formData.append('alt', 'Test Pixel Image');

    const uploadRes = await fetch(`${baseUrl}/api/upload/image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      body: formData,
    });

    const uploadData = await uploadRes.json();
    assert(uploadRes.status === 201 || uploadRes.status === 200, `POST /api/upload/image returned HTTP 201/200 Created`);
    assert(uploadData.success === true, `Upload response success is true`);
    assert(uploadData.data?.url?.startsWith('/api/images/'), `Upload returned relative URL: ${uploadData.data?.url}`);
    assert(!!uploadData.data?.fileId, `Upload returned fileId: ${uploadData.data?.fileId}`);

    // Verify the newly uploaded image is fetchable via GET
    const verifyFetch = await fetch(`${baseUrl}${uploadData.data.url}`);
    assert(verifyFetch.status === 200, `Streamed newly uploaded image via ${uploadData.data.url} returned HTTP 200`);

    // Clean up test image
    await deleteFileFromGridFS(imageBucket, uploadData.data.fileId);
    await Image.deleteOne({ _id: uploadData.data.id });
    console.log('  ✓ Cleaned up test image from GridFS and Image metadata.');

    // 6d: Test invalid magic bytes (fake image) -> 400
    const fakeFormData = new FormData();
    const fakeBlob = new Blob([Buffer.from('This is definitely not a PNG file.')], { type: 'image/png' });
    fakeFormData.append('image', fakeBlob, 'fake.png');

    const fakeUploadRes = await fetch(`${baseUrl}/api/upload/image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      body: fakeFormData,
    });
    assert(fakeUploadRes.status === 400, `Uploading spoofed/corrupt image returned HTTP 400 Bad Request`);

    // Step 7: Test Delete Protection & Reference Check
    console.log('\n[7/7] Testing Delete Route & Reference Protection...');
    // Attempting to delete a referenced image should be rejected
    const delRes = await fetch(`${baseUrl}/api/images/${sampleImage._id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    // Since sampleImage is referenced in the live website, delete should be blocked with 400
    assert(delRes.status === 400, `Deleting referenced image returned HTTP 400 (${(await delRes.json()).message})`);

    console.log('\n========================================================');
    console.log(`  ALL ${totalTests} TESTS PASSED SUCCESSFULLY! (${passedTests}/${totalTests})`);
    console.log('========================================================\n');

  } catch (err) {
    console.error('\nVerification failed with error:', err);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.disconnect();
  }
};

runVerification();
