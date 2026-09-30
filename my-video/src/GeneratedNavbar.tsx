// Agrilpa's actual public navigation, with inert handlers.
import React,{useRef} from 'react';
import {Link,Image} from './PageAdapters';
import {Button} from '@/components/ui/button';
import {Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle} from '@/components/ui/dialog';
import {Menu,X,LogOut,AlertCircle} from 'lucide-react';
export function GeneratedNavbar() {
  const isOpen=false,isLoggedIn=false,isLoggingOut=false,showVenderPopup=false,notificationCount=0;
  const venderPopupRef=useRef<HTMLDivElement>(null),venderButtonRef=useRef<HTMLButtonElement>(null);
  const setIsOpen=(_b:boolean)=>{},setShowVenderPopup=setIsOpen,handleVenderClick=()=>{},handleLogout=()=>{},getPanelUrl=()=>'/dashboard';
  const router={push:(_s:string)=>{}};
  const navLinks=[
    { href: "/como-funciona", label: "Cómo funciona" },
    { href: "/productos", label: "Productos" },
    { href: "/pedidos", label: "Pedidos" },
  ];
  const contactLink={ href: "/contacto", label: "Contáctenos" };
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-white dark:bg-background">
      <div className="px-6 lg:px-10">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/agrilpa-logo.svg" alt="Agrilpa Logo" width={130} height={130} priority />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex flex-1 items-center justify-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-base font-medium text-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {/* Vender Button */}
            <div className="relative">
              <button
                ref={venderButtonRef}
                onClick={handleVenderClick}
                className="px-4 py-2 text-base font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Vender
              </button>

              {/* Auth Guard Dialog for Vender */}
              <Dialog open={showVenderPopup && !isLoggedIn} onOpenChange={(open) => setShowVenderPopup(open)}>
                <DialogContent className="sm:max-w-md text-center">
                  <DialogHeader className="flex flex-col items-center gap-2">
                    <div className="bg-primary/10 p-3 rounded-full mb-2">
                      <AlertCircle className="w-8 h-8 text-primary" />
                    </div>
                    <DialogTitle className="text-xl">Inicia sesión requerida</DialogTitle>
                    <DialogDescription className="text-center text-base pt-2">
                      Para publicar tus productos, primero debes iniciar sesión o registrarte en Agrilpa.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-3 py-4 mt-2">
                    <Button
                      className="w-full bg-primary hover:bg-primary/90 text-white h-12 text-lg font-semibold"
                      onClick={() => {
                        setShowVenderPopup(false)
                        router.push("/auth")
                      }}
                    >
                      Iniciar sesión
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full h-12 text-lg font-semibold"
                      onClick={() => {
                        setShowVenderPopup(false)
                        router.push("/auth?mode=register")
                      }}
                    >
                      Registrarse
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Link
              href={contactLink.href}
              className="px-4 py-2 text-base font-medium text-foreground hover:text-primary transition-colors"
            >
              {contactLink.label}
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-3">
            {isLoggedIn ? (
              <>
                <Link
                  href={getPanelUrl()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-base font-medium text-foreground hover:text-primary transition-colors group relative"
                >
                  <span>Panel</span>
                  {notificationCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                  )}
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-base font-medium text-foreground hover:text-red-600 transition-colors group cursor-pointer disabled:opacity-70"
                >
                  <span>{isLoggingOut ? "Cerrando..." : "Cerrar Sesión"}</span>
                  <LogOut className={`h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 ${isLoggingOut ? "animate-spin" : ""}`} />
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-base font-medium text-foreground hover:text-primary transition-colors group"
              >
                <span>Iniciar sesión</span>
                <span className="text-base font-normal transition-transform duration-200 group-hover:translate-x-1">→</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-foreground hover:bg-muted"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2 text-sm font-medium text-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {/* Vender - Mobile */}
            <button
              onClick={() => {
                handleVenderClick();
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/10 rounded-md transition-colors"
            >
              Vender
            </button>

            <Link
              href={contactLink.href}
              className="block px-3 py-2 text-sm font-medium text-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
              onClick={() => setIsOpen(false)}
            >
              {contactLink.label}
            </Link>

            <div className="space-y-2 pt-2 border-t border-border">
              {isLoggedIn ? (
                <>
                  <Link
                    href={getPanelUrl()}
                    className="flex items-center justify-between px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-muted rounded-lg transition-colors group"
                    onClick={() => setIsOpen(false)}
                  >
                    <span className="flex items-center gap-2">
                      <span>Panel</span>
                      {notificationCount > 0 && (
                        <span className="flex h-2 w-2 rounded-full bg-red-500"></span>
                      )}
                    </span>
                  </Link>
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      handleLogout()
                    }}
                    disabled={isLoggingOut}
                    className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-semibold text-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors group text-left cursor-pointer disabled:opacity-70"
                  >
                    <span>{isLoggingOut ? "Cerrando sesión..." : "Cerrar Sesión"}</span>
                    <LogOut className={`h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 ${isLoggingOut ? "animate-spin" : ""}`} />
                  </button>
                </>
              ) : (
                <Link
                  href="/auth"
                  className="flex items-center justify-between px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-muted rounded-lg transition-colors group"
                  onClick={() => setIsOpen(false)}
                >
                  <span>Iniciar sesión</span>
                  <span className="text-sm text-muted-foreground group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
