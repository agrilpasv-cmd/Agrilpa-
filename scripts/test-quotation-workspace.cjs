/* Run: node scripts/test-quotation-workspace.cjs. No network or database writes. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks={}) {
  const module={exports:{}};
  const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(source,{module,exports:module.exports,require:name=>{if(!(name in mocks))throw new Error(`Unexpected dependency ${name}`);return mocks[name]},console,Date,Intl,Number,JSON,Request,Response});
  return module.exports;
}
const q=load('lib/quotations.ts');
const valid={...q.emptyQuotationRequest,quantity:'500.125',destinationCountry:'El Salvador',destinationLocation:'San Salvador',estimatedDate:'2099-10-01'};
assert.equal(Object.keys(q.validateQuotation(valid,500)).length,0);
assert.ok(q.validateQuotation({...valid,quantity:'499.999'},500).quantity);
assert.ok(q.validateQuotation({...valid,quantity:'0'}).quantity);
assert.ok(q.validateQuotation({...valid,quantity:'1.1234'}).quantity);
assert.ok(q.validateQuotation({...valid,quantity:'1.5',containerSize:'20ST'},0,true).quantity);
assert.equal(Object.keys(q.validateQuotation({...valid,quantity:'2',containerSize:'20ST'},0,true)).length,0);
assert.ok(q.validateQuotation({...valid,estimatedDate:'2099-02-30'}).estimatedDate);
assert.ok(q.validateQuotation({...valid,estimatedDate:'2020-01-01'}).estimatedDate);
assert.ok(q.validateQuotation({...valid,destinationLocation:''}).destinationLocation);
assert.equal(q.validateQuotation({...valid,deliveryMethod:'pickup',destinationLocation:''}).destinationLocation,undefined);
assert.ok(q.validateQuotation({...valid,targetPrice:'-1'}).targetPrice);
assert.ok(q.validateQuotation({...valid,notes:'x'.repeat(2001)}).notes);
assert.equal(q.quotationUnit({unit:'lb'}),'lb');
assert.equal(q.quotationUnit({unit:'kg',shippingUnitType:'FCL'}),'contenedor');
assert.equal(q.quotationCurrency('€'),'EUR');
assert.equal(q.quotationProductTerms({unit:'kg',min_order:'500 lb'}).unit,'lb');
assert.equal(q.quotationProductTerms({unit:'kg',min_order:'MIN. 25,000 kg'}).minimum,25000);
assert.equal(q.quotationProductTerms({unit:'kg',min_order:'1 Contenedor 20\u0027',shipping_unit_type:'FCL'}).minimum,1);
assert.equal(q.quotationProductTerms({unit:'kg',min_order:'500 lb',min_order_quantity:50}).unit,'kg');

let user={id:'buyer',email:'buyer@example.test',user_metadata:{}};
let product={id:'11111111-1111-4111-8111-111111111111',user_id:'seller',title:'Café',unit:'lb',min_order_quantity:500};
let quote={id:'22222222-2222-4222-8222-222222222222',seller_id:'seller',buyer_id:'buyer',email:'private@example.test',phone_number:'0000',contact_method:'WhatsApp'};
let inserted=null,rpcArgs=null,rpcCount=0;
const admin={from(table){const builder={select(){return builder},eq(){return builder},limit(){return builder},insert(value){inserted=value;return builder},async single(){return {data:{id:quote.id},error:null}},async maybeSingle(){return {data:table==='user_products'?product:table==='users'?{id:user?.id,full_name:'Nombre real',company_name:'Empresa real'}:table==='orders'?null:quote,error:null}}};return builder},async rpc(name,args){rpcCount++;rpcArgs={name,...args};return{data:{status:args.p_status,orderId:'order'},error:null}}};
const mocks={'next/server':{NextResponse:{json:(body,options={})=>({body,status:options.status||200})}},'@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user}})}})},'@/lib/supabase/admin':{createAdminClient:()=>admin},'@/lib/quotations':q};
const create=load('app/api/quotations/create/route.ts',mocks).POST;
const decide=load('app/api/quotations/update-status/route.ts',mocks).POST;
const detail=load('app/api/quotations/[id]/route.ts',mocks).GET;
const request=body=>new Request('http://localhost/api/quotations',{method:'POST',body:JSON.stringify(body),headers:{'Content-Type':'application/json'}});
(async()=>{
  let r=await create(request({...valid,productId:product.id,buyerId:'forged',sellerId:'forged',buyerName:'forged'}));
  assert.equal(r.status,201);assert.equal(inserted.buyer_id,'buyer');assert.equal(inserted.seller_id,'seller');assert.equal(inserted.buyer_name,'Empresa real');assert.equal(inserted.quantity,500.125);assert.equal(inserted.quantity_unit,'lb');assert.equal(inserted.contact_method,'platform');assert.equal(inserted.phone_number,null);
  const saved=user;user=null;inserted=null;r=await create(request({...valid,productId:product.id}));assert.equal(r.status,401);assert.equal(inserted,null);
  user={...saved,id:'seller'};r=await create(request({...valid,productId:product.id}));assert.equal(r.status,400);
  user=saved;r=await decide(request({quotationId:quote.id,status:'accepted',unitPrice:3,currency:'USD'}));assert.equal(r.status,404);assert.equal(rpcCount,0);
  user={...saved,id:'seller'};r=await decide(request({quotationId:quote.id,status:'accepted',unitPrice:0,currency:'USD'}));assert.equal(r.status,400);assert.equal(rpcCount,0);
  r=await decide(request({quotationId:quote.id,status:'accepted',unitPrice:2.5,currency:'EUR',sellerId:'forged'}));assert.equal(r.status,200);assert.equal(rpcArgs.p_seller_id,'seller');assert.equal(rpcArgs.p_currency,'EUR');assert.equal(rpcArgs.p_unit_price,2.5);assert.equal(rpcArgs.name,'decide_quotation');
  user={...saved,id:'stranger'};r=await detail(request({}),{params:Promise.resolve({id:quote.id})});assert.equal(r.status,404);
  user=saved;r=await detail(request({}),{params:Promise.resolve({id:quote.id})});assert.equal(r.status,200);assert.equal(r.body.viewer,'buyer');assert.equal(r.body.quotation.email,undefined);assert.equal(r.body.quotation.phone_number,undefined);
  console.log('Quotation validation, trusted identity, authorization, internal contact, decimals and agreement tests passed.');
})().catch(error=>{console.error(error);process.exitCode=1});
