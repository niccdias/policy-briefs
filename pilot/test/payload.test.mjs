import test from 'node:test';
import assert from 'node:assert/strict';
import {encodePayload,decodeRecord} from '../src/payload.mjs';
test('plain records remain exact and large Unicode notes round-trip within the save limit',async()=>{
 const small={revision:7,payload:'{"unchanged":true}'};
 assert.equal(await encodePayload(small.payload),small.payload);
 assert.deepEqual(await decodeRecord(small),small);
 const notes=Array.from({length:500},(_,i)=>`QA ${i}: `+'Evidence and explanation with accents: é, æ, 中文. '.repeat(45));
 const json=JSON.stringify({notes});assert.ok(new TextEncoder().encode(json).length>1000000);
 const payload=await encodePayload(json);assert.ok(payload.length<690000);
 assert.equal((await decodeRecord({revision:1,payload})).payload,json);
 await assert.rejects(decodeRecord({payload:'gzip-base64-v1:invalid'}),/server revision is preserved/);
});
