import { Resend } from 'resend'
import { buildPasswordResetEmail } from './emails/password-reset'
import agrilpaEmailLogo from './emails/agrilpa-logo.json'
import type { ProductContactRequest } from './contact/types'

const getResendClient = () => {
    if (!process.env.RESEND_API_KEY) {
        console.error("RESEND_API_KEY is not defined")
        throw new Error("RESEND_API_KEY no está configurada en las variables de entorno (.env.local)")
    }
    return new Resend(process.env.RESEND_API_KEY)
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ? `Agrilpa <${process.env.RESEND_FROM_EMAIL}>` : 'Agrilpa <onboarding@resend.dev>'

// Colors from the requested "Minimalist Black, White, Dark Green" theme
const THEME = {
    primary: '#1a4d2e', // Dark Green
    notificationPrimary: '#489e00',
    secondary: '#f3f4f6', // Light Gray/White
    text: '#111827', // Almost Black
    accent: '#4ade80', // Lighter Green for highlights
    border: '#e5e7eb'
}

/**
 * Helper to generate consistent minimalist email HTML
 */
const getMinimalistTemplate = (title: string, content: string, cta?: { text: string, url: string }, options: { year?: number, notification?: boolean } = {}) => `
<!DOCTYPE html>
<html lang="es" dir="ltr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${options.notification ? '<style>@media(max-width:600px){.notification-content{padding:24px!important}.notification-footer{padding:20px 24px!important}.notification-action{display:block!important;text-align:center!important}}</style>' : ''}
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9fafb;">
    <div lang="es" dir="ltr" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid ${THEME.border}; border-radius: 8px; overflow: hidden; margin-top: 20px; margin-bottom: 20px;">
        <!-- Minimalist Header -->
        <div style="background-color: #000000; padding: ${options.notification ? '0 20px' : '40px 20px'}; text-align: center; border-bottom: 4px solid ${options.notification ? THEME.notificationPrimary : THEME.primary};">
            <img src="${options.notification ? 'https://agrilpa.com/logo-email.png' : 'https://agrilpa-mvp-v2.vercel.app/logo-email.png'}" alt="Agrilpa" height="${options.notification ? 240 : 120}" style="display: block; margin: 0 auto; max-width: 400px;" />
        </div>
        
        <!-- Content -->
        <div class="notification-content" style="padding: 40px;">
            <h1 style="color: ${THEME.text}; margin-top: 0; margin-bottom: 20px; font-size: 20px; font-weight: 600;">${title}</h1>
            
            <div style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                ${content}
            </div>

            ${cta ? `
            <div style="margin-top: 30px; margin-bottom: 10px;">
                <a class="notification-action" href="${cta.url}" style="display: inline-block; background-color: ${options.notification ? THEME.notificationPrimary : THEME.primary}; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500; font-size: 16px;${options.notification ? 'line-height:24px;' : ''}">${cta.text}</a>
            </div>
            ` : ''}
        </div>

        <!-- Minimalist Footer -->
        <div class="notification-footer" style="background-color: ${THEME.secondary}; padding: 20px 40px; border-top: 1px solid ${THEME.border}; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: ${options.notification ? '#4b5563' : '#6b7280'};">© ${options.year || new Date().getFullYear()} Agrilpa. Comercio Justo y Sostenible 🌍</p>
        </div>
    </div>
</body>
</html>
`

/**
 * Notify seller when someone purchases their product
 */
export async function sendPurchaseNotification({
    sellerEmail,
    sellerName,
    buyerName,
    productName,
    quantity,
    price,
}: {
    sellerEmail: string
    sellerName: string
    buyerName: string
    productName: string
    quantity: number
    price: number
}) {
    try {
        const resend = getResendClient()

        const content = `
            <p>Hola <strong>${sellerName}</strong>,</p>
            <p style="font-size: 18px; color: ${THEME.primary}; font-weight: 500;">Tienes una nueva notificación de una compra.</p>
            <p>Un comprador ha adquirido tu producto:</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 15px;">
                <tr style="border-bottom: 1px solid ${THEME.border};">
                    <td style="padding: 12px 0; color: #6b7280;">Producto</td>
                    <td style="padding: 12px 0; text-align: right; font-weight: 600; color: ${THEME.text};">${productName}</td>
                </tr>
                <tr style="border-bottom: 1px solid ${THEME.border};">
                    <td style="padding: 12px 0; color: #6b7280;">Comprador</td>
                    <td style="padding: 12px 0; text-align: right; font-weight: 600; color: ${THEME.text};">${buyerName}</td>
                </tr>
                <tr style="border-bottom: 1px solid ${THEME.border};">
                    <td style="padding: 12px 0; color: #6b7280;">Cantidad</td>
                    <td style="padding: 12px 0; text-align: right; font-weight: 600; color: ${THEME.text};">${quantity} kg</td>
                </tr>
                <tr>
                    <td style="padding: 12px 0; color: #6b7280;">Total</td>
                    <td style="padding: 12px 0; text-align: right; font-weight: 700; color: ${THEME.primary}; font-size: 18px;">$${price.toFixed(2)} USD</td>
                </tr>
            </table>
            
            <p>Por favor ingresa a la plataforma para gestionar el envío.</p>
        `

        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: sellerEmail,
            subject: `🌿 ¡Felicidades! Nueva Venta de ${productName}`,
            html: getMinimalistTemplate('🌱 ¡Nueva Venta Confirmada!', content, { text: 'Gestionar Orden', url: 'https://agrilpa.com/admin/sales' }),
        })

        if (error) {
            console.error('[Email] Error sending purchase notification:', error)
            return { success: false, error }
        }
        return { success: true, data }
    } catch (err: any) {
        console.error('[Email] Failed to send purchase notification:', err)
        return { success: false, error: { message: err.message } }
    }
}

/**
 * Notify buyer when their quotation status changes (accepted/rejected)
 */
export async function sendQuotationStatusEmail({
    buyerEmail,
    buyerName,
    productName,
    status,
}: {
    buyerEmail: string
    buyerName: string
    productName: string
    status: 'accepted' | 'rejected'
}) {
    const isAccepted = status === 'accepted'
    const statusText = isAccepted ? 'Aprobada' : 'Rechazada'
    const message = isAccepted
        ? `El vendedor aceptó tu cotización de <strong>${productName}</strong>. Ahora puedes proceder con la compra.`
        : `El vendedor rechazó tu cotización de <strong>${productName}</strong>.`

    try {
        const resend = getResendClient()

        const content = `
            <p>Hola <strong>${buyerName}</strong>,</p>
            <p>Tu cotización para <strong>${productName}</strong> ha sido <strong>${statusText}</strong>.</p>
            <p>${message}</p>
        `

        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: buyerEmail,
            subject: `🍃 Tu Cotización fue ${statusText}: ${productName}`,
            html: getMinimalistTemplate(
                `🌿 Estado de tu Cotización`,
                content,
                isAccepted ? { text: 'Ver Orden', url: 'https://agrilpa.com/admin/purchases' } : undefined
            ),
        })

        if (error) {
            console.error('[Email] Error sending quotation status email:', error)
            return { success: false, error }
        }
        return { success: true, data }
    } catch (err: any) {
        console.error('[Email] Failed to send quotation status email:', err)
        return { success: false, error: { message: err.message } }
    }
}

/**
 * Notify seller when they receive a new quotation
 */
export async function sendNewQuotationNotification({
    sellerEmail,
    sellerName,
    buyerName,
    productName,
    quantity,
    targetPrice,
    location,
    productImage,
}: {
    sellerEmail: string
    sellerName: string
    buyerName: string
    productName: string
    quantity: number
    targetPrice?: number
    location: string
    productImage?: string
}) {
    try {
        const resend = getResendClient()

        const content = `
            <p>Hola <strong>${sellerName}</strong>,</p>
            <p style="font-size: 18px; color: ${THEME.primary}; font-weight: 500;">Tienes una nueva cotización pendiente.</p>
            <p>Un comprador está interesado en tu producto:</p>
            
            <div style="background-color: ${THEME.secondary}; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                ${productImage ? `<img src="${productImage}" alt="${productName}" style="width: 100%; max-width: 200px; height: auto; border-radius: 8px; margin-bottom: 15px; object-fit: cover;" />` : ''}
                <div style="text-align: left;">
                    <p style="margin: 0 0 10px 0;"><strong>Producto:</strong> ${productName}</p>
                    <p style="margin: 0 0 10px 0;"><strong>Comprador:</strong> ${buyerName}</p>
                    <p style="margin: 0 0 10px 0;"><strong>Cantidad:</strong> ${quantity} kg</p>
                    ${targetPrice ? `<p style="margin: 0 0 10px 0;"><strong>Oferta:</strong> $${targetPrice.toFixed(2)} USD</p>` : ''}
                    <p style="margin: 0;"><strong>Destino:</strong> ${location}</p>
                </div>
            </div>
        `

        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: sellerEmail,
            subject: `🍂 ¡Nueva Cotización Pendiente! - ${productName}`,
            html: getMinimalistTemplate('🍁 ¡Tienes una Cotización Pendiente!', content, { text: 'Responder Oferta', url: 'https://agrilpa.com/admin/quotations' }),
        })

        if (error) {
            console.error('[Email] Error sending quotation notification:', error)
            return { success: false, error }
        }
        return { success: true, data }
    } catch (err: any) {
        console.error('[Email] Failed to send quotation notification:', err)
        return { success: false, error: { message: err.message } }
    }
}

/**
 * Send newsletter email to a single recipient
 */
export async function sendNewsletterEmail({
    recipientEmail,
    recipientName,
    subject,
    htmlContent,
    includeGreeting = true,
}: {
    recipientEmail: string
    recipientName: string
    subject: string
    htmlContent: string
    includeGreeting?: boolean
}) {
    try {
        const resend = getResendClient()

        const greetingHtml = includeGreeting 
            ? `<p>Hola <strong>${recipientName}</strong>,</p>` 
            : '';

        const content = `
            ${greetingHtml}
            <div style="margin-top: ${includeGreeting ? '20px' : '0'};">
                ${htmlContent}
            </div>
        `

        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: recipientEmail,
            subject,
            html: getMinimalistTemplate(subject, content),
        })

        if (error) {
            console.error('[Email] Error sending newsletter:', error)
            return { success: false, error }
        }
        return { success: true, data }
    } catch (err: any) {
        console.error('[Email] Failed to send newsletter:', err)
        return { success: false, error: { message: err.message } }
    }
}

/**
 * Send welcome email to a newly registered user
 */
export async function sendWelcomeEmail({
    recipientEmail,
    recipientName,
}: {
    recipientEmail: string
    recipientName: string
}) {
    try {
        const resend = getResendClient()

        const content = `
            <p>Hola <strong>${recipientName}</strong>,</p>
            <p style="font-size: 18px; color: ${THEME.primary}; font-weight: 600;">¡Bienvenido a Agrilpa! 🌱</p>
            
            <p>Nos alegra tenerte en la <strong>plataforma agrícola global</strong> líder en compra y venta de productos agrícolas.</p>
            
            <p>En Agrilpa podrás:</p>
            <ul style="color: #4b5563; padding-left: 20px; text-align: left; display: inline-block;">
                <li style="margin-bottom: 8px;">🛒 <strong>Comprar y vender</strong> productos agrícolas de interés en todo el mundo.</li>
                <li style="margin-bottom: 8px;">🤝 <strong>Negociar y cotizar</strong> directamente y sin intermediarios.</li>
                <li style="margin-bottom: 8px;">🌍 <strong>Comunicarte</strong> de forma segura con compradores y proveedores globales.</li>
            </ul>
            
            <p>Estamos aquí para ayudarte a impulsar tu agro-negocio al siguiente nivel. ¡Explora el mercado hoy mismo!</p>
        `

        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: recipientEmail,
            subject: '🌱 ¡Bienvenido a Agrilpa! Tu mercado agrícola global',
            html: getMinimalistTemplate('¡Bienvenido a la comunidad Agrilpa!', content, { text: 'Ir al Panel de Control', url: 'https://agrilpa.com/dashboard' }),
        })

        if (error) {
            console.error('[Email] Error sending welcome email:', error)
            return { success: false, error }
        }
        return { success: true, data }
    } catch (err: any) {
        console.error('[Email] Failed to send welcome email:', err)
        return { success: false, error: { message: err.message } }
    }
}

/**
 * Notify user when their Pro membership is activated/updated
 */
export async function sendProMembershipEmail({
    recipientEmail,
    recipientName,
    expiryDate,
}: {
    recipientEmail: string
    recipientName: string
    expiryDate: string | null
}) {
    try {
        const resend = getResendClient()
        
        const formattedDate = expiryDate 
            ? new Date(expiryDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
            : "Sin vencimiento"

        const content = `
            <p>Hola <strong>${recipientName}</strong>,</p>
            <p style="font-size: 18px; color: ${THEME.primary}; font-weight: 600;">¡Felicidades, estás en otro nivel! 🚀</p>
            
            <p>Tu <strong>Membresía Pro</strong> en Agrilpa ha sido activada con éxito.</p>
            
            <div style="background-color: ${THEME.secondary}; padding: 25px; border-radius: 8px; margin: 20px 0; border: 1px solid ${THEME.border};">
                <p style="margin: 0 0 15px 0; font-weight: 600; color: ${THEME.text};">Beneficios de tu plan Pro:</p>
                <ul style="color: #4b5563; padding-left: 20px; margin: 0; text-align: left;">
                    <li style="margin-bottom: 8px;">📦 <strong>Publica hasta 10 productos</strong> en el mercado global.</li>
                    <li style="margin-bottom: 8px;">✨ <strong>Productos destacados:</strong> Tus anuncios aparecerán con prioridad.</li>
                    <li style="margin-bottom: 8px;">🔍 <strong>Orden por relevancia:</strong> Aparece en las primeras posiciones de búsqueda.</li>
                    <li style="margin-bottom: 8px;">✅ <strong>Perfil Verificado:</strong> Gana más confianza con tus clientes internacionales.</li>
                    <li style="margin-bottom: 8px;">📊 <strong>Acceso prioritario</strong> a nuevas funciones y herramientas.</li>
                </ul>
                <div style="margin-top: 20px; padding-top: 15px; border-top: 1px dashed ${THEME.border};">
                    <p style="margin: 0; font-size: 14px; color: #6b7280;">Vencimiento de membresía:</p>
                    <p style="margin: 5px 0 0 0; font-weight: 700; color: ${THEME.primary};">${formattedDate}</p>
                </div>
            </div>
            
            <p>Compra y vende en <strong>Agrilpa</strong>, la plataforma agrícola del comercio global.</p>
            <p>Estamos comprometidos con tu crecimiento internacional.</p>
        `

        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: recipientEmail,
            subject: '🚀 ¡Tu Membresía Pro en Agrilpa está activa!',
            html: getMinimalistTemplate('¡Bienvenido al nivel Pro!', content, { text: 'Ir a mi Dashboard', url: 'https://agrilpa.com/dashboard' }),
        })

        if (error) {
            console.error('[Email] Error sending pro membership email:', error)
            return { success: false, error }
        }
        return { success: true, data }
    } catch (err: any) {
        console.error('[Email] Failed to send pro membership email:', err)
        return { success: false, error: { message: err.message } }
    }
}
/**
 * Send email verification link to a newly registered user
 * The confirmationUrl comes from Supabase admin.generateLink()
 */
export async function sendEmailVerification({
    recipientEmail,
    recipientName,
    confirmationUrl,
}: {
    recipientEmail: string
    recipientName: string
    confirmationUrl: string
}) {
    try {
        const resend = getResendClient()

        const content = `
            <p>Hola <strong>${recipientName}</strong>,</p>
            <p style="font-size: 18px; color: ${THEME.primary}; font-weight: 600;">¡Ya casi estás dentro! 🌱</p>
            
            <p>Gracias por registrarte en <strong>Agrilpa</strong>. Solo necesitas verificar tu correo electrónico para activar tu cuenta.</p>
            
            <p>Haz clic en el botón de abajo para confirmar tu dirección de correo y comenzar a operar en el mercado agrícola global:</p>

            <p style="font-size: 13px; color: #6b7280; margin-top: 24px;">Si no creaste una cuenta en Agrilpa, puedes ignorar este correo de forma segura.</p>
        `

        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: recipientEmail,
            subject: '✅ Confirma tu correo para activar tu cuenta en Agrilpa',
            html: getMinimalistTemplate(
                '¡Confirma tu cuenta de Agrilpa!',
                content,
                { text: 'Verificar mi correo', url: confirmationUrl }
            ),
        })

        if (error) {
            console.error('[Email] Error sending verification email:', error)
            return { success: false, error }
        }
        return { success: true, data }
    } catch (err: any) {
        console.error('[Email] Failed to send verification email:', err)
        return { success: false, error: { message: err.message } }
    }
}

/**
 * Notify user about a new chat message
 */
export async function sendChatNotificationEmail({
    recipientEmail,
    recipientName,
    senderName,
    productName,
}: {
    recipientEmail: string
    recipientName: string
    senderName: string
    productName: string
}) {
    try {
        const resend = getResendClient()

        const content = `
            <p>Hola <strong>${recipientName}</strong>,</p>
            <p style="font-size: 18px; color: ${THEME.primary}; font-weight: 500;">Tienes un nuevo mensaje pendiente.</p>
            
            <p><strong>${senderName}</strong> te ha enviado un mensaje y está esperando tu respuesta respecto al producto <strong>${productName}</strong>.</p>
            
            <div style="background-color: ${THEME.secondary}; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid ${THEME.border};">
                <p style="margin: 0; color: ${THEME.text};">Entra a tu panel para continuar la negociación de forma segura.</p>
            </div>
        `

        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: recipientEmail,
            subject: `💬 Nuevo mensaje de ${senderName} sobre ${productName}`,
            html: getMinimalistTemplate('¡Tienes un nuevo mensaje!', content, { text: 'Ver Mensajes', url: 'https://agrilpa.com/dashboard/mensajes' }),
        })

        if (error) {
            console.error('[Email] Error sending chat notification:', error)
            return { success: false, error }
        }
        return { success: true, data }
    } catch (err: any) {
        console.error('[Email] Failed to send chat notification:', err)
        return { success: false, error: { message: err.message } }
    }
}

/**
 * 24-hour reminder for unread messages
 */
export async function sendUnreadChatReminderEmail({
    recipientEmail,
    recipientName,
    senderName,
    productName,
    hoursWaiting = 24,
}: {
    recipientEmail: string
    recipientName: string
    senderName: string
    productName: string
    hoursWaiting?: number
}) {
    try {
        const resend = getResendClient()

        const content = `
            <p>Hola <strong>${recipientName}</strong>,</p>
            <p style="font-size: 18px; color: ${THEME.primary}; font-weight: 600;">Tienes una negociación pendiente en Agrilpa.</p>
            
            <p>Hace más de ${hoursWaiting} horas, <strong>${senderName}</strong> te envió un mensaje respecto a <strong>${productName}</strong> y aún está esperando tu lectura y respuesta.</p>
            
            <div style="background-color: ${THEME.secondary}; padding: 18px; border-radius: 8px; margin: 20px 0; border: 1px solid ${THEME.border};">
                <p style="margin: 0; color: ${THEME.text}; font-size: 14px; line-height: 1.5;">
                    💡 <em>Consejo Agrilpa:</em> Responder oportunamente a tus compradores y vendedores mejora tu reputación comercial y asegura tus tratos antes que otros competidores.
                </p>
            </div>
            
            <p style="font-size: 14px; color: #6b7280;">Si ya respondiste este mensaje recientemente, puedes ignorar este aviso.</p>
        `

        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: recipientEmail,
            subject: `⏰ Recordatorio: Mensaje pendiente de ${senderName} sobre ${productName}`,
            html: getMinimalistTemplate('Recordatorio de negociación pendiente', content, { text: 'Responder Mensaje', url: 'https://agrilpa.com/dashboard/mensajes' }),
        })

        if (error) {
            console.error('[Email] Error sending 24h chat reminder:', error)
            return { success: false, error }
        }
        return { success: true, data }
    } catch (err: any) {
        console.error('[Email] Failed to send 24h chat reminder:', err)
        return { success: false, error: { message: err.message } }
    }
}

/**
 * Send password reset email with custom Agrilpa branding
 */
export async function sendPasswordResetEmail({
    recipientEmail,
    recipientName,
    resetUrl,
}: {
    recipientEmail: string
    recipientName: string
    resetUrl: string
}) {
    try {
        const resend = getResendClient()
        const { subject, html, text } = buildPasswordResetEmail({ recipientName, resetUrl })

        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: recipientEmail,
            subject,
            html,
            text,
            attachments: [{
                filename: 'agrilpa-logo.png',
                content: agrilpaEmailLogo.content,
                contentType: 'image/png',
                contentId: 'agrilpa-logo',
            }],
        })

        if (error) {
            console.error('[Email] Error sending password reset email:', error)
            return { success: false, error }
        }
        return { success: true, data }
    } catch (err: any) {
        console.error('[Email] Failed to send password reset email:', err)
        return { success: false, error: { message: err.message } }
    }
}

function escapeNotificationHtml(value: string) {
    return value.replace(
        /[&<>"']/g,
        (character) =>
            ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            })[character]!
    )
}

export function buildProductContactAdminEmail(
    recipientName: string,
    contact: ProductContactRequest
) {
    const safe = escapeNotificationHtml
    const inboxUrl = 'https://agrilpa.com/admin/mensajes?tab=solicitudes'
    const reference = `SOL-${contact.id.slice(0, 8).toUpperCase()}`
    const rows = [
        ['Producto', contact.product_title],
        ['Vendedor', contact.seller_name],
        ['Persona interesada', contact.full_name],
        ['País', contact.country_name],
        ['Correo electrónico', contact.email],
        ['WhatsApp', contact.phone],
        ['Referencia', reference]
    ]
    const content = `
        <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${safe(contact.full_name)} envió una consulta sobre ${safe(contact.product_title)}.</div>
        <p>Hola${recipientName.trim() ? ` <strong>${safe(recipientName.trim())}</strong>` : ''},</p>
        <p>Recibimos una nueva solicitud de contacto desde un producto de Agrilpa. Ya está disponible en <strong>Mensajes → Solicitudes de contacto</strong>.</p>
        <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;table-layout:fixed;border-collapse:collapse;margin:24px 0;font-size:15px;">
            ${rows.map(([label, value]) => `<tr><td style="width:36%;padding:12px 10px 12px 0;border-bottom:1px solid ${THEME.border};color:#4b5563;vertical-align:top;">${label}</td><td style="padding:12px 0;border-bottom:1px solid ${THEME.border};color:${THEME.text};font-weight:600;vertical-align:top;overflow-wrap:anywhere;word-break:break-word;">${safe(value)}</td></tr>`).join('')}
        </table>
        ${contact.message ? `<h2 style="font-size:16px;color:${THEME.text};margin:24px 0 10px;">Mensaje de la persona</h2><p style="margin:0;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;">${safe(contact.message)}</p>` : ''}
        <p style="font-size:14px;margin:24px 0 0;">Revisa la solicitud en el panel para coordinar el contacto con el vendedor.</p>
    `
    return {
        subject: `Nueva solicitud de contacto: ${contact.product_title.replace(/[\r\n]+/g, ' ').slice(0, 120)}`,
        html: getMinimalistTemplate(
            'Nueva solicitud de contacto',
            content,
            { text: 'Revisar solicitudes', url: inboxUrl },
            {
                notification: true,
                year: new Date(contact.created_at).getUTCFullYear()
            }
        ),
        text: `Hola${recipientName.trim() ? ` ${recipientName.trim()}` : ''},\n\nRecibimos una nueva solicitud de contacto desde un producto de Agrilpa.\n\n${rows.map(([label, value]) => `${label}: ${value}`).join('\n')}\n${contact.message ? `\nMensaje de la persona:\n${contact.message}\n` : ''}\nRevisar solicitudes:\n${inboxUrl}\n\nAgrilpa`
    }
}

export async function sendProductContactAdminEmail({
    recipientEmail,
    recipientName,
    contact,
    idempotencyKey
}: {
    recipientEmail: string
    recipientName: string
    contact: ProductContactRequest
    idempotencyKey: string
}) {
    try {
        const resend = getResendClient()
        const email = buildProductContactAdminEmail(recipientName, contact)
        const options = { idempotencyKey, signal: AbortSignal.timeout(10000) }
        const { data, error } = await resend.emails.send(
            {
                from: FROM_EMAIL,
                to: recipientEmail,
                replyTo: contact.email,
                ...email
            },
            options
        )
        if (error)
            return {
                success: false as const,
                error: {
                    code: error.name,
                    retryable:
                        error.statusCode === 429 ||
                        (error.statusCode != null && error.statusCode >= 500) ||
                        error.name === 'concurrent_idempotent_requests' ||
                        (error.statusCode == null && error.name === 'application_error')
                }
            }
        return { success: true as const, data }
    } catch (error) {
        const configured = !!process.env.RESEND_API_KEY
        return {
            success: false as const,
            error: {
                code: configured ? 'network_error' : 'missing_api_key',
                retryable: configured
            }
        }
    }
}
