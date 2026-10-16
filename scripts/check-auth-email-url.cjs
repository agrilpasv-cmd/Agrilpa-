const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

function load(filename, dependencies, environment = {}) {
  const module = {exports:{}}
  const source = ts.transpileModule(fs.readFileSync(filename,'utf8'), {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText
  vm.runInNewContext(source, {module,exports:module.exports,require:name=>{
    if(!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`)
    return dependencies[name]
  },URL,process:{env:environment},console:{error(){},warn(){}}})
  return module.exports
}

const links = load('lib/auth-email-url.ts',{})
for(const value of [undefined,'','invalid','http://localhost:3000','https://localhost:3000','https://preview.localhost','https://127.0.0.1','https://[::1]','https://0.0.0.0','http://agrilpa.com','javascript:alert(1)','https://user:password@example.com']) {
  assert.equal(links.getAuthEmailOrigin({SITE_URL:value}),'https://agrilpa.com')
}
assert.equal(links.getAuthEmailOrigin({SITE_URL:' https://agrilpa.com/ '}),'https://agrilpa.com')
assert.equal(links.getAuthEmailOrigin({SITE_URL:'https://agrilpa.com/path?q=1#fragment'}),'https://agrilpa.com')
assert.equal(links.getAuthEmailOrigin({SITE_URL:'http://localhost:3000',NEXT_PUBLIC_SITE_URL:'https://www.agrilpa.com/'}),'https://www.agrilpa.com')
const url = new URL(links.buildPasswordRecoveryUrl('test+hash/=?&',{}))
assert.equal(url.origin,'https://agrilpa.com')
assert.equal(url.pathname,'/auth/callback')
assert.equal(url.searchParams.get('token_hash'),'test+hash/=?&')
assert.equal(url.searchParams.get('type'),'recovery')

let sent, generated = 0
const admin = {
  from(){return {select(){return this},eq(){return this},async maybeSingle(){return {data:{full_name:'Nombre de prueba'}}}}},
  auth:{admin:{async generateLink(){generated++;return {data:{properties:{hashed_token:'TEST_ONLY'}},error:null}}}},
}
const route = load('app/api/auth/forgot-password/route.ts',{
  '@/lib/supabase/admin':{createAdminClient:()=>admin},
  '@/lib/email':{sendPasswordResetEmail:async message=>{sent=message;return {success:true}}},
  '@/lib/auth-email-url':links,
  'next/server':{NextResponse:{json:(body,options={})=>({body,status:options.status || 200})}},
})

async function run() {
  for(const origin of ['http://localhost:3000','https://untrusted-origin.example']) {
    const request = new Request('http://localhost:3000/api/auth/forgot-password',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({email:'recipient@example.test'})})
    const response = await route.POST(request)
    assert.equal(response.status,200)
    assert.equal(sent.resetUrl,'https://agrilpa.com/auth/callback?token_hash=TEST_ONLY&type=recovery')
    assert.equal(sent.recipientEmail,'recipient@example.test')
  }
  assert.equal(generated,2)
  console.log('PASS: public HTTPS domain, local/invalid configuration fallback, original token, and ignored request Origin. All services mocked; no emails or real tokens generated.')
}
run().catch(error=>{console.error(error);process.exitCode=1})
