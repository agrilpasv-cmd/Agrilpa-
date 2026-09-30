const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const video = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'app/auth/page.tsx'), 'utf8');
const ast = ts.createSourceFile('page.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const auth = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === 'AuthPageContent');
if (!auth?.body) throw new Error('Cannot find Agrilpa auth view');
const returned = auth.body.statements.find(ts.isReturnStatement);
const variables = auth.body.statements.filter(ts.isVariableStatement);
const form = variables.flatMap(n => Array.from(n.declarationList.declarations)).find(n => n.name.getText(ast) === '[formData, setFormData]');
const defaults = form.initializer.arguments[0].getText(ast);
const strength = variables.filter(n => ['regPassword','pwdChecks','strengthScore','getStrengthMeta','strengthMeta'].includes(n.declarationList.declarations[0].name.getText(ast))).map(n => n.getText(ast)).join('\n');
let markup = returned.expression.getText(ast);
markup = markup.replace(/name="([a-zA-Z0-9]+)"/g, (_, name) => `name="${name}" data-active={activeField === "${name}"}`);
markup = markup.replace("'url(\"/auth-bg-vineyard.jpg\")'", '`url("${staticFile("auth-bg-vineyard.jpg")}")`');
markup = markup.replace('className="flex-1 flex flex-col justify-center px-4', 'style={{translate: `0 ${contentOffset}px`}} className="flex-1 flex flex-col justify-center px-4');
const generated = `// Generated from app/auth/page.tsx by scripts/create-registration-view.cjs.
// The actual JSX and password-strength rules are retained; network handlers are omitted.
import React from 'react';
import {staticFile} from 'remotion';
import {Link, Image} from './PageAdapters';
import {Mail, Lock, User, Phone, ArrowRight, ArrowLeft, Eye, EyeOff, CheckCircle2, XCircle, ShieldCheck} from 'lucide-react';
import {CountryPicker, PhoneCodePicker} from '@/components/ui/country-picker';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
export const emptyFormData = ${defaults};
export type RegistrationData = typeof emptyFormData;
export function GeneratedAuthView({formData, registrationStep, requiresVerification = false, loading = false, activeField = '', contentOffset = 0}: {formData: RegistrationData; registrationStep: number; requiresVerification?: boolean; loading?: boolean; activeField?: string; contentOffset?: number}) {
  const isLogin = false, submitted = false, showLoginPwd = false, showRegPwd = false, showRegConfirmPwd = false;
  const error = '', verifyError = '', verifyLoading = false, resendLoading = false, resendSuccess = false, resendCooldown = 0;
  const setFormData: React.Dispatch<React.SetStateAction<RegistrationData>> = () => {};
  const setIsLogin: React.Dispatch<React.SetStateAction<boolean>> = () => {};
  const setShowLoginPwd: React.Dispatch<React.SetStateAction<boolean>> = () => {};
  const setShowRegPwd: React.Dispatch<React.SetStateAction<boolean>> = () => {};
  const setShowRegConfirmPwd: React.Dispatch<React.SetStateAction<boolean>> = () => {};
  const setRequiresVerification = (_value: boolean) => {};
  const setRegistrationStep = (_value: number) => {};
  const setRegistrationStartTime = (_value: number) => {};
  const setError = (_value: string) => {};
  const handleInputChange = () => {}, handlePhoneInput = () => {}, handleGoogleSignIn = () => {}, handleAlreadyVerified = () => {}, handleResendEmail = () => {};
  const handleSubmit = (event: React.FormEvent) => event.preventDefault();
  ${strength}
  return ${markup};
}
`;
fs.writeFileSync(path.join(video, 'src/GeneratedAuthView.tsx'), generated);
const cssFolder = path.join(root, '.next/dev/static/chunks');
const cssName = fs.readdirSync(cssFolder).find(n => n.startsWith('app_globals_css_') && n.endsWith('.css'));
if (!cssName) throw new Error('Start the local Agrilpa server first to generate its styles');
fs.copyFileSync(path.join(cssFolder, cssName), path.join(video, 'src/agrilpa-page.css'));
console.log('Generated the registration view and copied Agrilpa styles.');
