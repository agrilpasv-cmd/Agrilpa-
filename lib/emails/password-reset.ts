export interface PasswordResetEmailProps {
  recipientName: string
  resetUrl: string
  year?: number
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!)
}

export function buildPasswordResetEmail({ recipientName, resetUrl, year = new Date().getFullYear() }: PasswordResetEmailProps) {
  const url = new URL(resetUrl)
  if (!["https:", "http:"].includes(url.protocol)) throw new Error("El enlace de recuperación no es válido.")
  const name = recipientName.trim()
  const greeting = name ? `Hola ${escapeHtml(name)},` : "Hola,"
  const safeUrl = escapeHtml(resetUrl)
  const subject = "Restablece tu contraseña de Agrilpa"
  const text = `${name ? `Hola ${name},` : "Hola,"}

Recibimos una solicitud para restablecer la contraseña de tu cuenta de Agrilpa.

Restablecer contraseña:
${resetUrl}

Este enlace es de un solo uso y tiene una vigencia limitada. Si ya venció, solicita uno nuevo desde Agrilpa.

¿No solicitaste este cambio?
Puedes ignorar este correo. Tu contraseña no cambiará hasta que elijas una nueva.

El equipo de Agrilpa
© ${year} Agrilpa.`

  const html = `<!DOCTYPE html>
<html lang="es" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${subject}</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
    a:focus-visible { outline:3px solid #18340c; outline-offset:4px; }
    @media only screen and (max-width:480px) {
      .email-outer { padding:20px 12px!important; }
      .email-header { padding:28px 24px 24px!important; }
      .email-body { padding:0 24px 28px!important; }
      .email-heading { font-size:28px!important; line-height:34px!important; }
      .email-action { width:100%!important; }
      .email-action a { display:block!important; text-align:center!important; padding:16px 14px!important; }
      .email-footer { padding:20px 20px 4px!important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f5f6f3;font-family:Arial,Helvetica,sans-serif;color:#20251e;">
  <div lang="es" dir="ltr" style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#f5f6f3;">Elige una nueva contraseña para volver a entrar a tu cuenta de Agrilpa.</div>
  <table lang="es" dir="ltr" role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f5f6f3;">
    <tr><td class="email-outer" align="center" style="padding:40px 20px;">
      <!--[if mso]><table role="presentation" width="600" align="center" cellspacing="0" cellpadding="0" border="0"><tr><td><![endif]-->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;table-layout:fixed;background-color:#ffffff;border:1px solid #dfe4da;border-radius:12px;">
        <tr><td class="email-header" style="padding:36px 40px 28px;">
          <img src="cid:agrilpa-logo" width="143" height="41" alt="Agrilpa" style="display:block;width:143px;height:41px;border:0;background-color:#ffffff;">
        </td></tr>
        <tr><td class="email-body" style="padding:0 40px 36px;overflow-wrap:anywhere;">
          <h1 class="email-heading" style="margin:0 0 28px;font-size:32px;line-height:39px;letter-spacing:-0.8px;font-weight:700;color:#20251e;">Restablece tu contraseña</h1>
          <p style="margin:0 0 14px;font-size:16px;line-height:26px;color:#20251e;">${greeting}</p>
          <p style="margin:0 0 28px;font-size:16px;line-height:26px;color:#50584b;">Recibimos una solicitud para restablecer la contraseña de tu cuenta de Agrilpa.</p>
          <table class="email-action" role="presentation" cellspacing="0" cellpadding="0" border="0" style="max-width:100%;margin:0 0 18px;">
            <tr><td align="center" bgcolor="#489e00" style="background-color:#489e00;border-radius:8px;mso-padding-alt:16px 28px;">
              <a href="${safeUrl}" style="display:inline-block;box-sizing:border-box;max-width:100%;padding:16px 28px;border-radius:8px;background-color:#489e00;color:#102000;font-size:16px;line-height:24px;font-weight:700;text-decoration:none;text-align:center;">Restablecer contraseña</a>
            </td></tr>
          </table>
          <p style="margin:0 0 28px;font-size:14px;line-height:22px;color:#596251;">Este enlace es de un solo uso y tiene una vigencia limitada. Si ya venció, solicita uno nuevo desde Agrilpa.</p>
          <p style="margin:0 0 28px;font-size:16px;line-height:26px;color:#50584b;">El equipo de Agrilpa</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="table-layout:fixed;border-top:1px solid #e1e6dc;">
            <tr><td style="padding:24px 0 0;">
              <h2 style="margin:0 0 8px;font-size:16px;line-height:24px;font-weight:700;color:#20251e;">¿No solicitaste este cambio?</h2>
              <p style="margin:0 0 22px;font-size:14px;line-height:22px;color:#596251;">Puedes ignorar este correo. Tu contraseña no cambiará hasta que elijas una nueva.</p>
              <p style="margin:0 0 8px;font-size:14px;line-height:22px;color:#596251;">Si el botón no abre, copia este enlace en tu navegador:</p>
              <p style="margin:0;font-size:13px;line-height:21px;word-break:break-all;overflow-wrap:anywhere;">
                <a href="${safeUrl}" style="color:#365b1b;text-decoration:underline;word-break:break-all;overflow-wrap:anywhere;">${safeUrl}</a>
              </p>
            </td></tr>
          </table>
        </td></tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;">
        <tr><td class="email-footer" style="padding:22px 40px 0;text-align:left;">
          <p style="margin:0;font-size:13px;line-height:21px;color:#596251;">© ${year} Agrilpa. Este correo se envió por una solicitud de recuperación de contraseña.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
  return { subject, html, text }
}
