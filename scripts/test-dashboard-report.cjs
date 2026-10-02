// Generates synthetic reports for independent XLSX validation. No account access.
// node scripts/test-dashboard-report.cjs [output-directory]
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const ts = require('typescript');
const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const module = {exports:{}};
  const source = ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(source,{module,exports:module.exports,require:name=>load(path.resolve(path.dirname(file),name+'.ts')),console,Date,Intl,Number,JSON,TextEncoder,Uint8Array,Uint32Array,DataView});
  cache.set(file,module.exports);return module.exports;
}
const {buildOverview} = load('lib/dashboard/overview.ts');
const {dashboardExcelReport} = load('lib/dashboard/report-workbook.ts');
const out = process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(),'agrilpa-report-'));
fs.mkdirSync(out,{recursive:true});
const input = {
  userId:'demo',profile:{id:'demo',company_name:'Finca de ejemplo'},
  products:[{id:'coffee',user_id:'demo',title:'Café & cacao <selección>',views:1400,is_visible:true},{id:'mango',user_id:'demo',title:'=HYPERLINK("https://example.test","texto literal")',views:500,is_visible:true}],
  quotes:[],orders:[],conversations:[],messages:[],profiles:[{id:'partner',company_name:'Proveedor de ejemplo'}],productNames:{coffee:'Café de ejemplo'},chatAvailable:true,
};
const now = new Date('2026-10-01T18:15:00Z');
for(let day=0;day<180;day++) {
  const created_at = new Date(now.getTime()-day*86400000-3600000).toISOString();
  const seller = day%2 ? 'partner':'demo', buyer = seller==='demo' ? 'partner':'demo';
  for(let n=0;n<day%4;n++) input.quotes.push({id:`q-${day}-${n}`,seller_id:seller,buyer_id:buyer,product_id:'coffee',status:'accepted',created_at});
  input.orders.push({id:`o-${day}`,seller_id:seller,buyer_id:buyer,status:day%5?'delivered':'pending',total_price:day%11?650.5:null,currency:day%3?'USD':'EUR',created_at});
  if(day%3===0) {
    const id=`c-${day}`;
    input.conversations.push({id,seller_id:seller,buyer_id:buyer,product_id:'coffee'});
    input.messages.push({id:`m-${day}`,conversation_id:id,sender_id:'partner',created_at});
    if(day%2===0) input.messages.push({id:`r-${day}`,conversation_id:id,sender_id:'demo',created_at:new Date(Date.parse(created_at)+18*60000).toISOString()});
  }
}
const manifest=[];
for(const days of [7,30,90]) for(const role of ['seller','buyer']) for(const historical of [false,true]) {
  const data=buildOverview(input,days,now,historical?'2026-09-30':'');
  const file=`${role}-${days}-${historical?'history':'today'}.xlsx`;
  const bytes=dashboardExcelReport(data,role,'8BC646');
  assert.equal(new DataView(bytes.buffer).getUint32(0,true),0x04034b50);
  fs.writeFileSync(path.join(out,file),bytes);
  manifest.push({file,data,role});
}
for (const mode of ['empty','unavailable']) {
  const data=buildOverview(mode==='empty'?{...input,products:[],quotes:[],orders:[],conversations:[],messages:[]}: {...input,chatAvailable:false,conversations:[],messages:[]},30,now,'2026-09-30');
  const file=`${mode}.xlsx`;
  fs.writeFileSync(path.join(out,file),dashboardExcelReport(data,'seller'));
  manifest.push({file,data,role:'seller'});
}
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest));
console.log(`Generated ${manifest.length} synthetic reports: ${out}`);
