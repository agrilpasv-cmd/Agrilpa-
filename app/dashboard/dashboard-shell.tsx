"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
    Settings,
    Headphones,
    FileText,
    MessageSquare,
    Home,
    ClipboardList,
    Package,
    Truck,
    Plus,
    LayoutDashboard,
    ShoppingCart,
    Users,
    Eye,
    Star,
    Mail,
    DollarSign,
    MousePointer2,
    Crown,
    UserMinus,
    Image as ImageIcon,
    Activity,
    CreditCard,
    Newspaper,
    ListOrdered,
    Receipt,
    ShoppingBag,
    ArrowLeft,
    ArrowRight,
    Phone,
    Check
} from "lucide-react"
import { PanelSidebar } from "@/components/dashboard/panel-sidebar"
import { useDashboard } from "./context"
import { AuthStorage } from "@/lib/auth-storage"
import { CountryPicker, PhoneCodePicker } from "@/components/ui/country-picker"
import { useGlobalChat } from "@/components/chat/chat-context"

export default function DashboardShell({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const [isAdmin, setIsAdmin] = useState(false)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const { counts } = useDashboard()
    const { b2bUnreadCount, supportUnreadCount } = useGlobalChat()

    // Profile Setup Wizard states (for incomplete/OAuth registrations)
    const [isVerifyingSession, setIsVerifyingSession] = useState(true)  // block render until DB check completes
    const [isProfileIncomplete, setIsProfileIncomplete] = useState(false)
    const [setupStep, setSetupStep] = useState(1)
    const [isSubmittingSetup, setIsSubmittingSetup] = useState(false)
    const [setupError, setSetupError] = useState("")
    const [setupFormData, setSetupFormData] = useState({
        userType: "vendedor",
        userSubType: "",
        userSubTypeOther: "",
        companyName: "",
        companyWebsite: "",
        phoneNumber: "",
        countryCode: "503",
        country: "",
        state: "",
        address: "",
        product1: "",
        product2: "",
        product3: "",
        supplyCountry1: "",
        supplyCountry2: "",
        supplyCountry3: "",
        providerCountry1: "",
        providerCountry2: "",
        providerCountry3: "",
        hasExportCertificates: "",
        doesProvideInternationally: "false",
        volumeRange: "",
        howHeardAboutUs: "",
        howHeardOther: ""
    })

    useEffect(() => {
        // Fast sync from localStorage to avoid long waits for UI rendering
        const localSession = AuthStorage.getSession()
        if (localSession?.role === "admin") {
            setIsAdmin(true)
        }

        const verifySession = async () => {
            try {
                const { createBrowserClient } = await import("@/lib/supabase/client")
                const supabase = createBrowserClient()
                
                // Get the real session from Supabase
                const { data: { session } } = await supabase.auth.getSession()
                
                if (!session?.user) {
                    console.log("[Dashboard] No active session found, redirecting to auth...")
                    AuthStorage.clearSession()
                    router.push("/auth?redirectTo=" + encodeURIComponent(window.location.pathname))
                    return
                }

                // Verify profile for accurate role and completeness check
                const { data: profile } = await supabase
                    .from("users")
                    .select("*")
                    .eq("id", session.user.id)
                    .maybeSingle()
                
                let role = "user"
                const isAdminUser = session.user.email === "agrilpasv@gmail.com"
                
                if (!profile) {
                    // Create default profile for OAuth/Google users
                    const { error: insertError } = await supabase
                        .from("users")
                        .insert({
                            id: session.user.id,
                            email: session.user.email || "",
                            full_name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "Usuario Google",
                            user_type: "vendedor", // default type
                            role: isAdminUser ? "admin" : "user",
                        })
                    if (insertError) {
                        console.error("[Dashboard] Error creating default profile for Google user:", insertError)
                    } else {
                        console.log("[Dashboard] Created default profile for Google user")
                        role = isAdminUser ? "admin" : "user"
                        setIsProfileIncomplete(true)
                    }
                } else {
                    role = profile.role || "user"

                    // Admin users skip the setup wizard
                    if (!isAdminUser && role !== "admin") {
                        // Wizard is only considered complete when fields from ALL 3 steps are present:
                        //   Step 1: company_name (required)
                        //   Step 2: phone + country (required)
                        //   Step 3: how_heard_about_us (only written on final submit)
                        const wizardComplete =
                            !!profile.company_name &&
                            !!profile.phone &&
                            !!profile.country &&
                            !!profile.how_heard_about_us

                        if (!wizardComplete) {
                            console.log("[Dashboard] Profile wizard incomplete — showing setup modal")
                            setIsProfileIncomplete(true)
                        }
                    }
                }

                setIsAdmin(isAdminUser || role === "admin")
                
                // Sync to AuthStorage
                AuthStorage.setSession(session.user.id, session.user.email || "", role)
                
            } catch (err) {
                console.error("[Dashboard] Session verification failed:", err)
            }
        }
        
        verifySession().finally(() => setIsVerifyingSession(false))
    }, [router])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        
        // Restrict state and address to letters, numbers, and spaces
        if (name === "state" || name === "address") {
            const filteredValue = value.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, "")
            setSetupFormData(prev => ({
                ...prev,
                [name]: filteredValue
            }))
            return
        }

        setSetupFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        const numericValue = value.replace(/[^\d]/g, "")
        setSetupFormData(prev => ({
            ...prev,
            [name]: numericValue
        }))
    }

    const handleSetupSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmittingSetup(true)
        setSetupError("")

        // Comprehensive Validations
        if (!setupFormData.userType) {
            setSetupError("Debes seleccionar un tipo de usuario principal")
            setIsSubmittingSetup(false)
            return
        }
        if (!setupFormData.userSubType) {
            setSetupError("Debes seleccionar un subtipo de usuario")
            setIsSubmittingSetup(false)
            return
        }
        if (setupFormData.userSubType === "Otra" && !setupFormData.userSubTypeOther) {
            setSetupError("Debes especificar el otro subtipo de usuario")
            setIsSubmittingSetup(false)
            return
        }

        const alphanumericRegex = /[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/
        if (setupFormData.state && !alphanumericRegex.test(setupFormData.state)) {
            setSetupError("El campo Estado / Provincia debe contener letras o números")
            setIsSubmittingSetup(false)
            return
        }
        if (setupFormData.address && !alphanumericRegex.test(setupFormData.address)) {
            setSetupError("La dirección de la empresa debe contener letras o números")
            setIsSubmittingSetup(false)
            return
        }
        if (!setupFormData.product1 && !setupFormData.product2 && !setupFormData.product3) {
            setSetupError("Debe proveer al menos un producto de interés")
            setIsSubmittingSetup(false)
            return
        }
        if (!setupFormData.volumeRange) {
            setSetupError("Por favor selecciona tu volumen de movimiento")
            setIsSubmittingSetup(false)
            return
        }
        if (!setupFormData.howHeardAboutUs) {
            setSetupError("Por favor selecciona cómo te enteraste de nosotros")
            setIsSubmittingSetup(false)
            return
        }
        if (setupFormData.howHeardAboutUs === "Otro" && !setupFormData.howHeardOther) {
            setSetupError("Por favor especifica cómo te enteraste de nosotros")
            setIsSubmittingSetup(false)
            return
        }

        try {
            const { createBrowserClient } = await import("@/lib/supabase/client")
            const supabase = createBrowserClient()
            
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.user) {
                setSetupError("No se encontró sesión activa. Por favor inicia sesión de nuevo.")
                setIsSubmittingSetup(false)
                return
            }

            const productsOfInterest = [setupFormData.product1, setupFormData.product2, setupFormData.product3].filter(Boolean)
            const supplyCountries = [setupFormData.supplyCountry1, setupFormData.supplyCountry2, setupFormData.supplyCountry3].filter(Boolean)
            const providerCountries = setupFormData.doesProvideInternationally === "true"
                ? [setupFormData.providerCountry1, setupFormData.providerCountry2, setupFormData.providerCountry3].filter(Boolean)
                : []
            const fullPhone = setupFormData.phoneNumber ? `+${setupFormData.countryCode} ${setupFormData.phoneNumber}` : null

            const { error: updateError } = await supabase
                .from("users")
                .update({
                    company_name: setupFormData.companyName || null,
                    company_website: setupFormData.companyWebsite || null,
                    address: setupFormData.address || null,
                    state: setupFormData.state || null,
                    phone: fullPhone,
                    country: setupFormData.country || null,
                    user_type: setupFormData.userType,
                    user_sub_type: setupFormData.userSubType || null,
                    user_sub_type_other: setupFormData.userSubTypeOther || null,
                    products_of_interest: productsOfInterest,
                    supply_countries: supplyCountries,
                    provider_countries: providerCountries,
                    has_export_certificates: setupFormData.hasExportCertificates === "true",
                    annual_volume: setupFormData.volumeRange || null,
                    how_heard_about_us: setupFormData.howHeardAboutUs || null,
                    how_heard_other: setupFormData.howHeardOther || null
                })
                .eq("id", session.user.id)

            if (updateError) {
                console.error("[Dashboard] Error updating profile setup:", updateError)
                setSetupError(`Error al guardar perfil: ${updateError.message}`)
                setIsSubmittingSetup(false)
                return
            }

            console.log("[Dashboard] Profile setup completed successfully")
            setIsProfileIncomplete(false)
            
            // Reload page to ensure all components see the updated profile
            window.location.reload()
        } catch (err) {
            console.error("[Dashboard] Setup submit critical error:", err)
            setSetupError("Ocurrió un error inesperado al guardar tu perfil.")
            setIsSubmittingSetup(false)
        }
    }


    const adminMenuItems = [
        { href: "/", label: "Inicio", icon: Home, notifications: 0 },
        { href: "/dashboard", label: "Admin Dashboard", icon: LayoutDashboard, notifications: 0 },
        { href: "/admin/hero", label: "Hero (Banners)", icon: ImageIcon, notifications: 0 },
        { href: "/admin/actividad", label: "Registro de Actividad", icon: Activity, notifications: 0 },
        { href: "/admin/usuarios", label: "Gestión de Usuarios", icon: Users, notifications: 0 },
        { href: "/admin/membresias", label: "Membresías", icon: Crown, notifications: 0 },
        { href: "/admin/cotizaciones", label: "Cotizaciones", icon: ClipboardList, notifications: 0 },
        { href: "/admin/contactar", label: "Contactar", icon: MousePointer2, notifications: 0 },
        { href: "/admin/publicaciones", label: "Publicaciones", icon: Package, notifications: 0 },
        { href: "/admin/visibilidad", label: "Visibilidad", icon: Eye, notifications: 0 },
        { href: "/admin/reviews", label: "Reviews", icon: Star, notifications: 0 },
        { href: "/admin/suscripciones", label: "Suscripciones", icon: CreditCard, notifications: 0 },
        { href: "/admin/financiamiento", label: "Financiamiento", icon: DollarSign, notifications: 0 },
        { href: "/admin/logistica", label: "Logística", icon: Truck, notifications: 0 },
        { href: "/admin/compras", label: "Compras Globales", icon: ShoppingCart, notifications: 0 },
        { href: "/dashboard/mensajes", label: "Mensajes B2B", icon: MessageSquare, notifications: b2bUnreadCount || 0 },
        { href: "/admin/contactanos", label: "Contáctanos", icon: MessageSquare, notifications: counts.contactanos || 0 },
        { href: "/admin/newsletter", label: "Newsletter", icon: Newspaper, notifications: 0 },
        { href: "/admin/bajas", label: "Reportes de Bajas", icon: UserMinus, notifications: 0 },
    ]

    const userMenuItems = [
        { href: "/", label: "Inicio", icon: Home, notifications: 0 },
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, notifications: 0 },
        { href: "/dashboard/mensajes", label: "Mensajes B2B", icon: MessageSquare, notifications: b2bUnreadCount || 0 },
        { href: "/dashboard/perfil", label: "Mi Perfil", icon: FileText, notifications: counts.perfil },
        {
            href: "/dashboard/mis-publicaciones",
            label: "Publicaciones",
            icon: Plus,
            notifications: counts.publicaciones,
        },
        {
            href: "/dashboard/mis-solicitudes",
            label: "Solicitudes",
            icon: ListOrdered,
            notifications: 0,
        },
        {
            href: "/dashboard/cotizaciones",
            label: "Cotizaciones",
            icon: ClipboardList,
            notifications: counts.cotizaciones,
        },
        { href: "/dashboard/ventas", label: "Mis Ventas", icon: ShoppingBag, notifications: counts.ventas },
        { href: "/dashboard/compras", label: "Mis Compras", icon: ShoppingCart, notifications: counts.compras },
        {
            href: "/dashboard/logistica",
            label: "Logística",
            icon: Truck,
            notifications: counts.logistica,
        },
        {
            href: "/dashboard/transacciones",
            label: "Transacciones",
            icon: Receipt,
            notifications: counts.transacciones,
        },
        { href: "/dashboard/configuracion", label: "Configuración", icon: Settings, notifications: 0 },
        { href: "/dashboard/soporte", label: "Soporte", icon: Headphones, notifications: supportUnreadCount || 0 },
    ]

    const menuItems = isAdmin ? adminMenuItems : userMenuItems

    const handleLogout = async () => {
        if (isLoggingOut) return
        setIsLoggingOut(true)

        try {
            const { createBrowserClient } = await import("@/lib/supabase/client")
            const supabase = createBrowserClient()

            // Sign out from Supabase and clear server-side session in parallel
            await Promise.allSettled([
                supabase.auth.signOut(),
                fetch("/api/auth/logout", { method: "POST" })
            ])

            // Clear all local storage and session storage to ensure complete logout
            localStorage.clear()
            sessionStorage.clear()

            // Use window.location.replace to prevent back button from restoring session
            window.location.replace("/")
        } catch (error) {
            console.error("[Dashboard] Error al cerrar sesión:", error)
            // Clear storage even on error
            localStorage.clear()
            sessionStorage.clear()
            window.location.replace("/")
        } finally {
            setIsLoggingOut(false)
        }
    }

    // Block the entire UI until the DB session check is done.
    // This prevents the race condition where the wizard hadn't appeared yet
    // and the user could briefly see/interact with the dashboard.
    if (isVerifyingSession) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Image src="/agrilpa-logo.svg" alt="Agrilpa" width={140} height={50} priority />
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mt-4" />
                    <p className="text-sm text-muted-foreground">Verificando sesión...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="flex">
                <PanelSidebar items={menuItems} admin={isAdmin} open={isSidebarOpen} onOpenChange={setIsSidebarOpen} locked={isProfileIncomplete} onLogout={handleLogout} loggingOut={isLoggingOut} />

                {/* Main Content - blurred and blocked when profile is incomplete */}
                <main className={`min-w-0 flex-1 bg-white pt-16 md:pt-0 ${isProfileIncomplete ? "pointer-events-none select-none filter blur-sm" : ""}`}>
                    {children}
                </main>
            </div>

            {/* Modal de Configuración Inicial (Para usuarios Google OAuth nuevos o perfiles incompletos) */}
            {/* Note: backdrop does NOT have onClick to prevent dismissal - modal is mandatory */}
            {isProfileIncomplete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-6 overflow-y-auto">
                    <div className="bg-[#FDFCF8] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden transition-all transform scale-100 border border-border/50">
                        
                        {/* Left Sidebar Stepper (Desktop) */}
                        <div className="hidden md:flex flex-col w-[300px] bg-white p-8 border-r border-border/50 shrink-0 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-10 -mt-10 pointer-events-none"></div>
                            
                            <div className="mb-10 relative z-10">
                                <Image src="/agrilpa-logo.svg" alt="Agrilpa" width={140} height={50} priority />
                                <p className="text-sm text-muted-foreground mt-4 font-medium">Configura tu perfil comercial para desbloquear todas las herramientas de negociación B2B.</p>
                            </div>

                            <div className="flex-1 relative z-10">
                                <div className="space-y-6">
                                    {/* Step 1 */}
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors ${setupStep >= 1 ? 'border-primary bg-primary text-white shadow-md shadow-primary/20' : 'border-gray-200 text-muted-foreground bg-white'}`}>
                                                {setupStep > 1 ? <Check className="w-4 h-4" /> : "1"}
                                            </div>
                                            <div className={`w-0.5 h-full mt-2 transition-colors ${setupStep > 1 ? 'bg-primary' : 'bg-gray-100'}`}></div>
                                        </div>
                                        <div className="pb-6">
                                            <p className={`font-bold ${setupStep >= 1 ? 'text-foreground' : 'text-muted-foreground'}`}>Perfil Comercial</p>
                                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">Información básica y tipo de empresa</p>
                                        </div>
                                    </div>

                                    {/* Step 2 */}
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors ${setupStep >= 2 ? 'border-primary bg-primary text-white shadow-md shadow-primary/20' : 'border-gray-200 text-muted-foreground bg-white'}`}>
                                                {setupStep > 2 ? <Check className="w-4 h-4" /> : "2"}
                                            </div>
                                            <div className={`w-0.5 h-full mt-2 transition-colors ${setupStep > 2 ? 'bg-primary' : 'bg-gray-100'}`}></div>
                                        </div>
                                        <div className="pb-6">
                                            <p className={`font-bold ${setupStep >= 2 ? 'text-foreground' : 'text-muted-foreground'}`}>Ubicación</p>
                                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">Datos de contacto y origen</p>
                                        </div>
                                    </div>

                                    {/* Step 3 */}
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors ${setupStep >= 3 ? 'border-primary bg-primary text-white shadow-md shadow-primary/20' : 'border-gray-200 text-muted-foreground bg-white'}`}>
                                                3
                                            </div>
                                        </div>
                                        <div>
                                            <p className={`font-bold ${setupStep >= 3 ? 'text-foreground' : 'text-muted-foreground'}`}>Preferencias Comerciales</p>
                                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">Productos de interés y volúmenes</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Content Area */}
                        <div className="flex-1 flex flex-col relative h-[90vh] overflow-y-auto">
                            {/* Mobile Header (Hidden on Desktop) */}
                            <div className="md:hidden p-5 border-b border-border bg-white sticky top-0 z-10">
                                <div className="flex justify-between items-center mb-4">
                                    <Image src="/agrilpa-logo.svg" alt="Agrilpa" width={110} height={40} priority />
                                    <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">Paso {setupStep} de 3</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3].map((step) => (
                                        <div key={step} className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${setupStep >= step ? "bg-primary" : "bg-gray-100"}`} />
                                    ))}
                                </div>
                            </div>

                        {setupError && (
                            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
                                {setupError}
                            </div>
                        )}

                        {/* Content */}
                            {isSubmittingSetup && !setupError && (
                                <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
                                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                                            <Check className="w-8 h-8 text-white" />
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-bold text-foreground mb-2">¡Perfil Completado!</h3>
                                    <p className="text-muted-foreground font-medium">Configurando tu panel B2B...</p>
                                </div>
                            )}
                        <form onSubmit={handleSetupSubmit} className="p-6 md:p-8 flex-1 space-y-5">
                            {setupStep === 1 && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Tipo de Usuario *</label>
                                        <select 
                                            name="userType" 
                                            value={setupFormData.userType} 
                                            onChange={(e) => {
                                                handleInputChange(e);
                                                setSetupFormData(prev => ({ ...prev, userSubType: "", userSubTypeOther: "" }));
                                            }} 
                                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition bg-white mb-4"
                                        >
                                            <option value="vendedor">Vendedor Agrícola</option>
                                            <option value="comprador">Comprador/Distribuidor</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            {setupFormData.userType === "vendedor" ? "¿Qué tipo de vendedor eres? *" : "¿Qué tipo de comprador eres? *"}
                                        </label>
                                        <select
                                            name="userSubType"
                                            value={setupFormData.userSubType}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition bg-white mb-3"
                                            required
                                        >
                                            <option value="" disabled>Selecciona una opción</option>
                                            {setupFormData.userType === "vendedor" ? (
                                                <>
                                                    <option value="Productor agrícola / Caficultor">Productor agrícola / Caficultor</option>
                                                    <option value="Cooperativa agrícola">Cooperativa agrícola</option>
                                                    <option value="Asociación de productores">Asociación de productores</option>
                                                    <option value="Empresa cafetalera / Agroindustria">Empresa cafetalera / Agroindustria</option>
                                                    <option value="Distribuidor o comercializador local">Distribuidor o comercializador local</option>
                                                    <option value="Otra">Otra</option>
                                                </>
                                            ) : (
                                                <>
                                                    <option value="Supermercado o cadena retail">Supermercado o cadena retail</option>
                                                    <option value="Distribuidor / Mayorista">Distribuidor / Mayorista</option>
                                                    <option value="Procesadora de alimentos">Procesadora de alimentos</option>
                                                    <option value="Tostador o industria de café / cacao">Tostador o industria de café / cacao</option>
                                                    <option value="Empresa importadora / exportadora">Empresa importadora / exportadora</option>
                                                    <option value="Hotel, restaurante o servicio de alimentos (HORECA)">Hotel, restaurante o servicio de alimentos (HORECA)</option>
                                                    <option value="Otra">Otra</option>
                                                </>
                                            )}
                                        </select>
                                        {setupFormData.userSubType === "Otra" && (
                                            <div className="animate-in fade-in zoom-in duration-300">
                                                <input
                                                    type="text"
                                                    name="userSubTypeOther"
                                                    value={setupFormData.userSubTypeOther}
                                                    onChange={handleInputChange}
                                                    placeholder="Especifica el tipo"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition"
                                                    required
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Nombre de la Empresa *</label>
                                        <input type="text" name="companyName" value={setupFormData.companyName} onChange={handleInputChange} placeholder="Agro Exportaciones S.A." className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition" required />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">¿Posee certificados para exportar? *</label>
                                        <select name="hasExportCertificates" value={setupFormData.hasExportCertificates} onChange={handleInputChange} className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white transition ${setupFormData.hasExportCertificates === "" ? "border-amber-400 bg-amber-50" : "border-gray-300"}`} required>
                                            <option value="" disabled>Selecciona una opción...</option>
                                            <option value="true">Sí, tengo certificados de exportación</option>
                                            <option value="false">No, no tengo certificados</option>
                                        </select>
                                        {setupFormData.hasExportCertificates === "" && (
                                            <p className="text-xs text-amber-600 mt-1">⚠ Este campo es obligatorio</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Página web (Opcional)</label>
                                        <input type="text" name="companyWebsite" value={setupFormData.companyWebsite} onChange={handleInputChange} placeholder="www.tuempresa.com" className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition" />
                                    </div>
                                </div>
                            )}

                            {setupStep === 2 && (
                                <div className="space-y-4">
                                    <div className="w-full">
                                        <label className="block text-sm font-medium text-foreground mb-2">País *</label>
                                        <CountryPicker
                                            value={setupFormData.country}
                                            syncPhoneCode
                                            onChange={(countryName, phoneCode) => {
                                                setSetupFormData(prev => ({
                                                    ...prev,
                                                    country: countryName,
                                                    ...(phoneCode ? { countryCode: phoneCode } : {}),
                                                }))
                                            }}
                                            placeholder="Selecciona tu país"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Estado / Provincia *</label>
                                        <input type="text" name="state" value={setupFormData.state} onChange={handleInputChange} placeholder="Ej. Antioquia, Texas, San Salvador" className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition" required />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Dirección de la Empresa *</label>
                                        <input type="text" name="address" value={setupFormData.address} onChange={handleInputChange} placeholder="Calle Principal #123" className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition" required />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Teléfono *</label>
                                        <div className="flex gap-3">
                                            <PhoneCodePicker
                                                value={setupFormData.countryCode}
                                                onChange={(phoneCode) => setSetupFormData(prev => ({ ...prev, countryCode: phoneCode }))}
                                                className="w-36 shrink-0"
                                            />
                                            <input type="text" name="phoneNumber" value={setupFormData.phoneNumber} onChange={handlePhoneInput} inputMode="numeric" placeholder="00000000" className="flex-1 px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition" required />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {setupStep === 3 && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            {setupFormData.userType === 'vendedor' 
                                                ? "Productos que Ofreces / Cultivas *" 
                                                : "Productos que Buscas Comprar *"} 
                                            <span className="text-muted-foreground font-normal"> (Ingresa al menos 1)</span>
                                        </label>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <input
                                                type="text"
                                                name="product1"
                                                value={setupFormData.product1}
                                                onChange={handleInputChange}
                                                placeholder="ej. Algodón"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition"
                                            />
                                            <input
                                                type="text"
                                                name="product2"
                                                value={setupFormData.product2}
                                                onChange={handleInputChange}
                                                placeholder="ej. Mangos"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition"
                                            />
                                            <input
                                                type="text"
                                                name="product3"
                                                value={setupFormData.product3}
                                                onChange={handleInputChange}
                                                placeholder="ej. Fertilizantes"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Países de interés comercial (Opcional)</label>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <input
                                                type="text"
                                                name="supplyCountry1"
                                                value={setupFormData.supplyCountry1}
                                                onChange={handleInputChange}
                                                placeholder="ej. México"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition"
                                            />
                                            <input
                                                type="text"
                                                name="supplyCountry2"
                                                value={setupFormData.supplyCountry2}
                                                onChange={handleInputChange}
                                                placeholder="ej. Colombia"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition"
                                            />
                                            <input
                                                type="text"
                                                name="supplyCountry3"
                                                value={setupFormData.supplyCountry3}
                                                onChange={handleInputChange}
                                                placeholder="ej. Guatemala"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">¿Abastecen o proveen productos de algún país? *</label>
                                        <select
                                            name="doesProvideInternationally"
                                            value={setupFormData.doesProvideInternationally}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white transition mb-3"
                                        >
                                            <option value="false">No</option>
                                            <option value="true">Sí</option>
                                        </select>

                                        {setupFormData.doesProvideInternationally === "true" && (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-in fade-in zoom-in duration-300">
                                                <input
                                                    type="text"
                                                    name="providerCountry1"
                                                    value={setupFormData.providerCountry1}
                                                    onChange={handleInputChange}
                                                    placeholder="Ej. México *"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition"
                                                    required={setupFormData.doesProvideInternationally === "true"}
                                                />
                                                <input
                                                    type="text"
                                                    name="providerCountry2"
                                                    value={setupFormData.providerCountry2}
                                                    onChange={handleInputChange}
                                                    placeholder="Ej. Colombia (Opcional)"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition"
                                                />
                                                <input
                                                    type="text"
                                                    name="providerCountry3"
                                                    value={setupFormData.providerCountry3}
                                                    onChange={handleInputChange}
                                                    placeholder="Ej. Guatemala (Opcional)"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Volumen de Movimiento Anual * <span className="text-muted-foreground font-normal">(USD $)</span>
                                        </label>
                                        <select
                                            name="volumeRange"
                                            value={setupFormData.volumeRange}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white transition"
                                            required
                                        >
                                            <option value="">Selecciona un rango</option>
                                            <option value="0-5000">De $0 a $5,000</option>
                                            <option value="5001-50000">De $5,001 a $50,000</option>
                                            <option value="50001-250000">De $50,001 a $250,000</option>
                                            <option value="250001-500000">De $250,001 a $500,000</option>
                                            <option value="500001-1000000">De $500,001 a $1,000,000</option>
                                            <option value="1000000plus">Más de $1,000,000</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            ¿Cómo se enteró de nosotros? *
                                        </label>
                                        <select
                                            name="howHeardAboutUs"
                                            value={setupFormData.howHeardAboutUs}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white transition mb-3"
                                            required
                                        >
                                            <option value="" disabled>Selecciona una opción</option>
                                            <option value="TikTok">TikTok</option>
                                            <option value="Instagram">Instagram</option>
                                            <option value="Facebook">Facebook</option>
                                            <option value="LinkedIn">LinkedIn</option>
                                            <option value="Reddit">Reddit</option>
                                            <option value="Correo">Correo</option>
                                            <option value="Recomendación de un amigo/colega">Recomendación de un amigo/colega</option>
                                            <option value="Internet">Internet</option>
                                            <option value="Otro">Otro</option>
                                        </select>

                                        {setupFormData.howHeardAboutUs === "Otro" && (
                                            <div className="animate-in fade-in zoom-in duration-300 mt-2">
                                                <input
                                                    type="text"
                                                    name="howHeardOther"
                                                    value={setupFormData.howHeardOther}
                                                    onChange={handleInputChange}
                                                    placeholder="Especifique cómo se enteró"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition"
                                                    required
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Footer Buttons */}
                            <div className="flex gap-3 pt-6 border-t border-border mt-6">
                                {setupStep > 1 ? (
                                    <button
                                        type="button"
                                        onClick={() => { setSetupError(""); setSetupStep(prev => prev - 1) }}
                                        className="flex-1 bg-white border border-gray-300 text-foreground font-semibold py-3.5 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2 transition uppercase"
                                    >
                                        <ArrowLeft className="w-5 h-5 mr-1" /> ATRÁS
                                    </button>
                                ) : (
                                    <div className="flex-1" />
                                )}

                                {setupStep < 3 ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const alphanumericRegex = /[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/
                                            if (setupStep === 1) {
                                                if (!setupFormData.companyName) {
                                                    setSetupError("Por favor ingresa el nombre de tu empresa")
                                                    return
                                                }
                                                if (setupFormData.hasExportCertificates === "") {
                                                    setSetupError("Por favor indica si posees certificados para exportar")
                                                    return
                                                }
                                            }
                                            if (setupStep === 2) {
                                                if (!setupFormData.country || !setupFormData.state || !setupFormData.address || !setupFormData.phoneNumber) {
                                                    setSetupError("Por favor completa todos los campos de ubicación")
                                                    return
                                                }
                                                if (setupFormData.state && !alphanumericRegex.test(setupFormData.state)) {
                                                    setSetupError("El Estado / Provincia debe contener letras o números")
                                                    return
                                                }
                                                if (setupFormData.address && !alphanumericRegex.test(setupFormData.address)) {
                                                    setSetupError("La dirección debe contener letras o números")
                                                    return
                                                }
                                            }
                                            setSetupError("")
                                            setSetupStep(prev => prev + 1)
                                        }}
                                        className="flex-[2] bg-primary text-white font-semibold py-3.5 rounded-md flex items-center justify-center gap-2 hover:bg-primary/90 transition uppercase"
                                    >
                                        SIGUIENTE PASO <ArrowRight className="w-5 h-5 ml-1" />
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={isSubmittingSetup}
                                        className="flex-[2] bg-primary text-white font-semibold py-3.5 flex items-center justify-center gap-2 rounded-md hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed uppercase"
                                    >
                                        {isSubmittingSetup ? "CREANDO..." : "COMPLETAR REGISTRO"} <ArrowRight className="w-5 h-5 ml-1" />
                                    </button>
                                )}
                            </div>
                        </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
