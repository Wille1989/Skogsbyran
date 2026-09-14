import { build } from 'esbuild';
import { unlink } from 'node:fs/promises';
const source=String.raw`
import React from 'react';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter,Routes,Route} from 'react-router-dom';
import {ShowPage} from './src/modules/property/presentation/ShowPage';
import Layout from './src/shared/presentation/Layout';
import {downloadDocument} from './src/modules/document/api';
const image=(id,primary=false)=>({imageId:String(id),urls:{large:'https://example.test/'+id+'.jpg',medium:'medium',thumbnail:'thumb'},position:id,isPrimary:primary,details:{altText:'Skog '+id,caption:''},adjustments:{brightness:1,contrast:1,gamma:1,saturation:1}});
const base={propertyId:'p1',details:{title:'Testfastighet',caption:'Riktig beskrivning',price:'1000000',size:'52',slug:'',listingStatus:'available',isVisible:true},images:[],areas:[],location:null,documents:[{propertyId:'p1',documentId:'d1',type:'prospect',title:'Prospekt',originalName:'prospekt.pdf',url:'https://example.test/prospekt.pdf',mimeType:'application/pdf',sizeBytes:102400}]};
function render(property,user=null){const client=new QueryClient();client.setQueryData(['property','p1'],{property});client.setQueryData(['auth','currentUser'],user);const html=renderToStaticMarkup(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/property/p1']}><Layout><Routes><Route path='/property/:propertyId' element={<ShowPage/>}/></Routes></Layout></MemoryRouter></QueryClientProvider>);client.clear();return html;}
for(const user of [null,{isAdmin:false}]){const html=render(base,user);for(const forbidden of ['type="file"','Ladda upp dokument','Ta bort','document-type'])assert.ok(!html.includes(forbidden),forbidden);assert.ok(html.includes('https://example.test/prospekt.pdf'));assert.ok(html.includes('Ladda ner'));}
const admin=render(base,{isAdmin:true});assert.ok(admin.includes('type="file"'));assert.ok(admin.includes('Ta bort'));
const empty=render({...base,documents:[],details:{...base.details,caption:'',price:'',size:''}});assert.ok(empty.includes('Det finns inga bilder'));assert.ok(!empty.includes('detail-location'));assert.ok(!empty.includes('detail-description'));assert.ok(!empty.includes('undefined'));assert.ok(!empty.includes('Anmäl intresse'));
const single=render({...base,images:[image(1)]});assert.ok(!single.includes('property-viewer-thumbnails'));assert.ok(single.includes('alt="Skog 1"'));
const many=render({...base,images:[image(1),image(2,true),image(3)]});assert.ok(many.includes('property-viewer-thumbnails'));assert.ok(many.includes('src="https://example.test/2.jpg"'));assert.ok(many.includes('aria-pressed="true"'));
for(const listingStatus of ['available','upcoming','sold']){const html=render({...base,details:{...base.details,listingStatus}});assert.ok(html.includes('Kontakta oss'));assert.ok(!html.includes('Anmäl intresse'));assert.ok(html.includes('href="/"'));}
const originalFetch=globalThis.fetch;try{globalThis.fetch=async()=>new Response('PDF',{status:200});assert.equal(await(await downloadDocument('https://example.test/file')).text(),'PDF');globalThis.fetch=async()=>new Response('',{status:403});await assert.rejects(downloadDocument('https://example.test/file'));}finally{globalThis.fetch=originalFetch;}
console.log('PASS: guest/non-admin/admin documents, download success/error, empty optional data, 0/1/3 images, primary ordering, thumbnails, available/upcoming/sold, back link and contact CTA.');`;
try{await build({stdin:{contents:source,resolveDir:process.cwd(),loader:'tsx'},tsconfig:'tsconfig.app.json',alias:{'@':process.cwd()+'/src'},bundle:true,platform:'node',format:'esm',packages:'external',outfile:'.detail-render-check.mjs',loader:{'.css':'empty'},define:{'import.meta.env':'{}'},logLevel:'silent'});await import('./.detail-render-check.mjs');}finally{await unlink('.detail-render-check.mjs').catch(()=>{});}
