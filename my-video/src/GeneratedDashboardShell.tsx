// Generated from Agrilpa's real dashboard navigation; no authentication or network calls.
import React from 'react';
import {Link,Image} from './PageAdapters';
import {Badge} from '@/components/ui/badge';
import {Menu,X,LogOut,Settings,FileText,MessageSquare,Home,ClipboardList,Truck,Plus,LayoutDashboard,ShoppingCart,ListOrdered,Receipt,ShoppingBag} from 'lucide-react';
export function GeneratedDashboardShell({children}: {children:React.ReactNode}) {
  const isProfileIncomplete=false,isLoggingOut=false,isSidebarOpen=false,unreadCount=0;
  const counts={perfil:0,publicaciones:0,cotizaciones:0,ventas:0,compras:0,logistica:0,transacciones:0};
  const setIsSidebarOpen=(_b:boolean)=>{},handleLogout=()=>{};
  const menuItems=[
        { href: "/", label: "Inicio", icon: Home, notifications: 0 },
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, notifications: 0 },
        { href: "/dashboard/mensajes", label: "Mensajes B2B", icon: MessageSquare, notifications: unreadCount || 0 },
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
    ];
  return (
        <div className="min-h-screen bg-background">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="px-6 lg:px-10">
                    <div className="flex justify-between items-center h-20">
                        <Link href="/" className="flex items-center space-x-2">
                            <Image src="/agrilpa-logo.svg" alt="Agrilpa Logo" width={130} height={130} priority />
                        </Link>

                        <div className="hidden md:flex items-center space-x-3">
                            {/* Hide profile link and show only logout when setup is pending */}
                            {!isProfileIncomplete && (
                                <Link
                                    href="/dashboard/perfil"
                                    className="inline-flex items-center gap-1.5 px-4 py-2 text-base font-medium text-foreground hover:text-primary transition-colors group"
                                >
                                    <span>Mi Perfil</span>
                                </Link>
                            )}
                            {isProfileIncomplete && (
                                <span className="text-sm text-amber-600 font-medium bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
                                    ⚠ Completa tu perfil para continuar
                                </span>
                            )}
                            <button
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-base font-medium text-foreground hover:text-red-600 transition-colors group cursor-pointer disabled:opacity-70"
                            >
                                <span>{isLoggingOut ? "Cerrando..." : "Cerrar Sesión"}</span>
                                <LogOut className={`w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 ${isLoggingOut ? "animate-spin" : ""}`} />
                            </button>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-foreground hover:bg-muted"
                        >
                            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </nav>

            <div className="flex">
                {/* Sidebar - locked if profile is incomplete */}
                <aside
                    className={`${
                        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                    } md:translate-x-0 fixed md:relative w-64 h-[calc(100vh-64px)] bg-card border-r border-border transition-transform duration-300 ease-in-out z-40 overflow-y-auto`}
                >
                    <div className="p-6">
                        {isProfileIncomplete ? (
                            // Blocked sidebar placeholder
                            <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                                    <span className="text-2xl">🔒</span>
                                </div>
                                <p className="text-sm text-muted-foreground font-medium">
                                    Completa tu perfil para acceder al panel
                                </p>
                            </div>
                        ) : (
                            <nav className="space-y-2">
                                {menuItems.map((item) => {
                                    const Icon = item.icon
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-foreground hover:bg-muted transition-colors hover:text-primary group"
                                            onClick={() => setIsSidebarOpen(false)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon className="w-5 h-5" />
                                                <span className="font-medium">{item.label}</span>
                                            </div>

                                            {item.notifications > 0 && (
                                                <Badge
                                                    variant="destructive"
                                                    className="min-w-[20px] h-5 flex items-center justify-center rounded-full text-xs px-1.5"
                                                >
                                                    {item.notifications > 99 ? "99+" : item.notifications}
                                                </Badge>
                                            )}
                                        </Link>
                                    )
                                })}
                            </nav>
                        )}
                    </div>
                </aside>

                {/* Main Content - blurred and blocked when profile is incomplete */}
                <main className={`flex-1 overflow-auto bg-[#f5f7f5] ${isProfileIncomplete ? "pointer-events-none select-none filter blur-sm" : ""}`}>
                    {children}
                </main>
            </div>

            </div>);
}
