"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { MapPin, Search, ChevronDown, X } from "lucide-react"
import ReactCountryFlag from "react-country-flag"

function FlagImg({ code, size = 20 }: { code: string; size?: number }) {
    return (
        <ReactCountryFlag
            countryCode={code}
            svg
            style={{ width: Math.round(size * 1.5), height: size, borderRadius: 2, objectFit: "cover" }}
            aria-label={code}
        />
    )
}

export const COUNTRIES: { name: string; code: string; phoneCode: string }[] = [
    { name: "Afganistán", code: "AF", phoneCode: "93" },
    { name: "Albania", code: "AL", phoneCode: "355" },
    { name: "Alemania", code: "DE", phoneCode: "49" },
    { name: "Andorra", code: "AD", phoneCode: "376" },
    { name: "Angola", code: "AO", phoneCode: "244" },
    { name: "Antigua y Barbuda", code: "AG", phoneCode: "1-268" },
    { name: "Arabia Saudita", code: "SA", phoneCode: "966" },
    { name: "Argelia", code: "DZ", phoneCode: "213" },
    { name: "Argentina", code: "AR", phoneCode: "54" },
    { name: "Armenia", code: "AM", phoneCode: "374" },
    { name: "Australia", code: "AU", phoneCode: "61" },
    { name: "Austria", code: "AT", phoneCode: "43" },
    { name: "Azerbaiyán", code: "AZ", phoneCode: "994" },
    { name: "Bahamas", code: "BS", phoneCode: "1-242" },
    { name: "Bangladés", code: "BD", phoneCode: "880" },
    { name: "Barbados", code: "BB", phoneCode: "1-246" },
    { name: "Baréin", code: "BH", phoneCode: "973" },
    { name: "Bélgica", code: "BE", phoneCode: "32" },
    { name: "Belice", code: "BZ", phoneCode: "501" },
    { name: "Benín", code: "BJ", phoneCode: "229" },
    { name: "Bielorrusia", code: "BY", phoneCode: "375" },
    { name: "Bolivia", code: "BO", phoneCode: "591" },
    { name: "Bosnia y Herzegovina", code: "BA", phoneCode: "387" },
    { name: "Botsuana", code: "BW", phoneCode: "267" },
    { name: "Brasil", code: "BR", phoneCode: "55" },
    { name: "Brunéi", code: "BN", phoneCode: "673" },
    { name: "Bulgaria", code: "BG", phoneCode: "359" },
    { name: "Burkina Faso", code: "BF", phoneCode: "226" },
    { name: "Burundi", code: "BI", phoneCode: "257" },
    { name: "Bután", code: "BT", phoneCode: "975" },
    { name: "Cabo Verde", code: "CV", phoneCode: "238" },
    { name: "Camboya", code: "KH", phoneCode: "855" },
    { name: "Camerún", code: "CM", phoneCode: "237" },
    { name: "Canadá", code: "CA", phoneCode: "1" },
    { name: "Catar", code: "QA", phoneCode: "974" },
    { name: "Chad", code: "TD", phoneCode: "235" },
    { name: "Chile", code: "CL", phoneCode: "56" },
    { name: "China", code: "CN", phoneCode: "86" },
    { name: "Chipre", code: "CY", phoneCode: "357" },
    { name: "Colombia", code: "CO", phoneCode: "57" },
    { name: "Comoras", code: "KM", phoneCode: "269" },
    { name: "Congo", code: "CG", phoneCode: "242" },
    { name: "Corea del Norte", code: "KP", phoneCode: "850" },
    { name: "Corea del Sur", code: "KR", phoneCode: "82" },
    { name: "Costa Rica", code: "CR", phoneCode: "506" },
    { name: "Costa de Marfil", code: "CI", phoneCode: "225" },
    { name: "Croacia", code: "HR", phoneCode: "385" },
    { name: "Cuba", code: "CU", phoneCode: "53" },
    { name: "Dinamarca", code: "DK", phoneCode: "45" },
    { name: "Dominica", code: "DM", phoneCode: "1-767" },
    { name: "Ecuador", code: "EC", phoneCode: "593" },
    { name: "Egipto", code: "EG", phoneCode: "20" },
    { name: "El Salvador", code: "SV", phoneCode: "503" },
    { name: "Emiratos Árabes Unidos", code: "AE", phoneCode: "971" },
    { name: "Eritrea", code: "ER", phoneCode: "291" },
    { name: "Eslovaquia", code: "SK", phoneCode: "421" },
    { name: "Eslovenia", code: "SI", phoneCode: "386" },
    { name: "España", code: "ES", phoneCode: "34" },
    { name: "Estados Unidos", code: "US", phoneCode: "1" },
    { name: "Estonia", code: "EE", phoneCode: "372" },
    { name: "Etiopía", code: "ET", phoneCode: "251" },
    { name: "Filipinas", code: "PH", phoneCode: "63" },
    { name: "Finlandia", code: "FI", phoneCode: "358" },
    { name: "Fiyi", code: "FJ", phoneCode: "679" },
    { name: "Francia", code: "FR", phoneCode: "33" },
    { name: "Gabón", code: "GA", phoneCode: "241" },
    { name: "Gambia", code: "GM", phoneCode: "220" },
    { name: "Georgia", code: "GE", phoneCode: "995" },
    { name: "Ghana", code: "GH", phoneCode: "233" },
    { name: "Granada", code: "GD", phoneCode: "1-473" },
    { name: "Grecia", code: "GR", phoneCode: "30" },
    { name: "Guatemala", code: "GT", phoneCode: "502" },
    { name: "Guinea", code: "GN", phoneCode: "224" },
    { name: "Guinea-Bisáu", code: "GW", phoneCode: "245" },
    { name: "Guinea Ecuatorial", code: "GQ", phoneCode: "240" },
    { name: "Guyana", code: "GY", phoneCode: "592" },
    { name: "Haití", code: "HT", phoneCode: "509" },
    { name: "Honduras", code: "HN", phoneCode: "504" },
    { name: "Hungría", code: "HU", phoneCode: "36" },
    { name: "India", code: "IN", phoneCode: "91" },
    { name: "Indonesia", code: "ID", phoneCode: "62" },
    { name: "Irak", code: "IQ", phoneCode: "964" },
    { name: "Irán", code: "IR", phoneCode: "98" },
    { name: "Irlanda", code: "IE", phoneCode: "353" },
    { name: "Islandia", code: "IS", phoneCode: "354" },
    { name: "Islas Marshall", code: "MH", phoneCode: "692" },
    { name: "Islas Salomón", code: "SB", phoneCode: "677" },
    { name: "Israel", code: "IL", phoneCode: "972" },
    { name: "Italia", code: "IT", phoneCode: "39" },
    { name: "Jamaica", code: "JM", phoneCode: "1-876" },
    { name: "Japón", code: "JP", phoneCode: "81" },
    { name: "Jordania", code: "JO", phoneCode: "962" },
    { name: "Kazajistán", code: "KZ", phoneCode: "7" },
    { name: "Kenia", code: "KE", phoneCode: "254" },
    { name: "Kirguistán", code: "KG", phoneCode: "996" },
    { name: "Kiribati", code: "KI", phoneCode: "686" },
    { name: "Kuwait", code: "KW", phoneCode: "965" },
    { name: "Laos", code: "LA", phoneCode: "856" },
    { name: "Lesoto", code: "LS", phoneCode: "266" },
    { name: "Letonia", code: "LV", phoneCode: "371" },
    { name: "Líbano", code: "LB", phoneCode: "961" },
    { name: "Liberia", code: "LR", phoneCode: "231" },
    { name: "Libia", code: "LY", phoneCode: "218" },
    { name: "Liechtenstein", code: "LI", phoneCode: "423" },
    { name: "Lituania", code: "LT", phoneCode: "370" },
    { name: "Luxemburgo", code: "LU", phoneCode: "352" },
    { name: "Madagascar", code: "MG", phoneCode: "261" },
    { name: "Malasia", code: "MY", phoneCode: "60" },
    { name: "Malaui", code: "MW", phoneCode: "265" },
    { name: "Maldivas", code: "MV", phoneCode: "960" },
    { name: "Malí", code: "ML", phoneCode: "223" },
    { name: "Malta", code: "MT", phoneCode: "356" },
    { name: "Marruecos", code: "MA", phoneCode: "212" },
    { name: "Mauricio", code: "MU", phoneCode: "230" },
    { name: "Mauritania", code: "MR", phoneCode: "222" },
    { name: "México", code: "MX", phoneCode: "52" },
    { name: "Micronesia", code: "FM", phoneCode: "691" },
    { name: "Moldavia", code: "MD", phoneCode: "373" },
    { name: "Mónaco", code: "MC", phoneCode: "377" },
    { name: "Mongolia", code: "MN", phoneCode: "976" },
    { name: "Montenegro", code: "ME", phoneCode: "382" },
    { name: "Mozambique", code: "MZ", phoneCode: "258" },
    { name: "Myanmar", code: "MM", phoneCode: "95" },
    { name: "Namibia", code: "NA", phoneCode: "264" },
    { name: "Nauru", code: "NR", phoneCode: "674" },
    { name: "Nepal", code: "NP", phoneCode: "977" },
    { name: "Nicaragua", code: "NI", phoneCode: "505" },
    { name: "Níger", code: "NE", phoneCode: "227" },
    { name: "Nigeria", code: "NG", phoneCode: "234" },
    { name: "Noruega", code: "NO", phoneCode: "47" },
    { name: "Nueva Zelanda", code: "NZ", phoneCode: "64" },
    { name: "Omán", code: "OM", phoneCode: "968" },
    { name: "Países Bajos", code: "NL", phoneCode: "31" },
    { name: "Pakistán", code: "PK", phoneCode: "92" },
    { name: "Palaos", code: "PW", phoneCode: "680" },
    { name: "Panamá", code: "PA", phoneCode: "507" },
    { name: "Papúa Nueva Guinea", code: "PG", phoneCode: "675" },
    { name: "Paraguay", code: "PY", phoneCode: "595" },
    { name: "Perú", code: "PE", phoneCode: "51" },
    { name: "Polonia", code: "PL", phoneCode: "48" },
    { name: "Portugal", code: "PT", phoneCode: "351" },
    { name: "Reino Unido", code: "GB", phoneCode: "44" },
    { name: "República Centroafricana", code: "CF", phoneCode: "236" },
    { name: "República Checa", code: "CZ", phoneCode: "420" },
    { name: "República del Congo", code: "CD", phoneCode: "243" },
    { name: "República Dominicana", code: "DO", phoneCode: "1-809" },
    { name: "Ruanda", code: "RW", phoneCode: "250" },
    { name: "Rumanía", code: "RO", phoneCode: "40" },
    { name: "Rusia", code: "RU", phoneCode: "7" },
    { name: "Saint Kitts y Nevis", code: "KN", phoneCode: "1-869" },
    { name: "Samoa", code: "WS", phoneCode: "685" },
    { name: "San Marino", code: "SM", phoneCode: "378" },
    { name: "San Vicente y las Granadinas", code: "VC", phoneCode: "1-784" },
    { name: "Santa Lucía", code: "LC", phoneCode: "1-758" },
    { name: "Santo Tomé y Príncipe", code: "ST", phoneCode: "239" },
    { name: "Senegal", code: "SN", phoneCode: "221" },
    { name: "Serbia", code: "RS", phoneCode: "381" },
    { name: "Seychelles", code: "SC", phoneCode: "248" },
    { name: "Sierra Leona", code: "SL", phoneCode: "232" },
    { name: "Singapur", code: "SG", phoneCode: "65" },
    { name: "Siria", code: "SY", phoneCode: "963" },
    { name: "Somalia", code: "SO", phoneCode: "252" },
    { name: "Sri Lanka", code: "LK", phoneCode: "94" },
    { name: "Suazilandia", code: "SZ", phoneCode: "268" },
    { name: "Sudáfrica", code: "ZA", phoneCode: "27" },
    { name: "Sudán", code: "SD", phoneCode: "249" },
    { name: "Sudán del Sur", code: "SS", phoneCode: "211" },
    { name: "Suecia", code: "SE", phoneCode: "46" },
    { name: "Suiza", code: "CH", phoneCode: "41" },
    { name: "Surinam", code: "SR", phoneCode: "597" },
    { name: "Tailandia", code: "TH", phoneCode: "66" },
    { name: "Tanzania", code: "TZ", phoneCode: "255" },
    { name: "Tayikistán", code: "TJ", phoneCode: "992" },
    { name: "Timor del Este", code: "TL", phoneCode: "670" },
    { name: "Togo", code: "TG", phoneCode: "228" },
    { name: "Tonga", code: "TO", phoneCode: "676" },
    { name: "Trinidad y Tobago", code: "TT", phoneCode: "1-868" },
    { name: "Túnez", code: "TN", phoneCode: "216" },
    { name: "Turkmenistán", code: "TM", phoneCode: "993" },
    { name: "Turquía", code: "TR", phoneCode: "90" },
    { name: "Tuvalu", code: "TV", phoneCode: "688" },
    { name: "Ucrania", code: "UA", phoneCode: "380" },
    { name: "Uganda", code: "UG", phoneCode: "256" },
    { name: "Uruguay", code: "UY", phoneCode: "598" },
    { name: "Uzbekistán", code: "UZ", phoneCode: "998" },
    { name: "Vanuatu", code: "VU", phoneCode: "678" },
    { name: "Venezuela", code: "VE", phoneCode: "58" },
    { name: "Vietnam", code: "VN", phoneCode: "84" },
    { name: "Yemen", code: "YE", phoneCode: "967" },
    { name: "Yibuti", code: "DJ", phoneCode: "253" },
    { name: "Zambia", code: "ZM", phoneCode: "260" },
    { name: "Zimbabue", code: "ZW", phoneCode: "263" },
]

interface CountryPickerProps {
    value: string
    onChange: (countryName: string, phoneCode?: string) => void
    placeholder?: string
    className?: string
    /** If true, selecting a country auto-fills the phone code too */
    syncPhoneCode?: boolean
    id?: string
    error?: boolean
}

export function CountryPicker({ value, onChange, placeholder = "Selecciona tu país", className = "", syncPhoneCode = false, id, error = false }: CountryPickerProps) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const selected = COUNTRIES.find(c => c.name === value)

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim()
        if (!q) return COUNTRIES
        return COUNTRIES.filter(c => c.name.toLowerCase().includes(q))
    }, [search])

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false)
                setSearch("")
            }
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [])

    // Focus search input when dropdown opens
    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 50)
        }
    }, [open])

    const handleSelect = (country: typeof COUNTRIES[0]) => {
        onChange(country.name, syncPhoneCode ? country.phoneCode : undefined)
        setOpen(false)
        setSearch("")
    }

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation()
        onChange("", "")
    }

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Trigger button */}
            <button
                id={id}
                aria-invalid={error ? true : undefined}
                type="button"
                onClick={() => setOpen(p => !p)}
                className={`w-full flex items-center gap-2 pl-10 pr-9 py-3 border rounded-lg text-left transition focus:outline-none focus:ring-2 focus:ring-primary ${error
                    ? "!border-[#b74434] !ring-1 !ring-[#b74434]"
                    : open
                    ? "border-primary ring-2 ring-primary"
                    : "border-border hover:border-gray-400"
                    } bg-white`}
            >
                {/* Map pin icon on the left */}
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />

                {selected ? (
                    <span className="flex items-center gap-2 flex-1 min-w-0">
                        <FlagImg code={selected.code} size={18} />
                        <span className="truncate text-base">{selected.name}</span>
                    </span>
                ) : (
                    <span className="text-gray-400 flex-1 text-base">{placeholder}</span>
                )}

                {/* Right icons */}
                <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {value && (
                        <span
                            onClick={handleClear}
                            className="p-0.5 hover:bg-gray-100 rounded cursor-pointer"
                        >
                            <X className="w-3.5 h-3.5 text-gray-400" />
                        </span>
                    )}
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
                </span>
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-border rounded-lg shadow-xl overflow-hidden">
                    {/* Search */}
                    <div className="p-2 border-b border-border flex items-center gap-2">
                        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar país..."
                            className="flex-1 text-sm outline-none bg-transparent placeholder:text-muted-foreground"
                        />
                        {search && (
                            <button type="button" onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="overflow-y-auto max-h-52">
                        {filtered.length === 0 ? (
                            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                                No se encontró ningún país
                            </div>
                        ) : (
                            filtered.map(country => (
                                <button
                                    key={country.code}
                                    type="button"
                                    onClick={() => handleSelect(country)}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors text-sm ${country.name === value ? "bg-primary/5 font-medium text-primary" : ""
                                        }`}
                                >
                                    <FlagImg code={country.code} size={18} />
                                    <span className="flex-1">{country.name}</span>
                                    {country.name === value && (
                                        <span className="text-primary text-xs">✓</span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

// ── Phone Code Picker ────────────────────────────────────────────────────────
// A compact trigger (flag + +code) that opens a searchable list of countries
interface PhoneCodePickerProps {
    /** The dial code currently selected, e.g. "503" */
    value: string
    /** Called with the new dial code */
    onChange: (phoneCode: string, countryCode: string) => void
    className?: string
}

export function PhoneCodePicker({ value, onChange, className = "" }: PhoneCodePickerProps) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Find the country matching the current phone code
    const selected = COUNTRIES.find(c => c.phoneCode === value)

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim()
        if (!q) return COUNTRIES
        return COUNTRIES.filter(
            c => c.name.toLowerCase().includes(q) || c.phoneCode.includes(q)
        )
    }, [search])

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false)
                setSearch("")
            }
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [])

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 50)
    }, [open])

    const handleSelect = (country: typeof COUNTRIES[0]) => {
        onChange(country.phoneCode, country.code)
        setOpen(false)
        setSearch("")
    }

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen(p => !p)}
                className={`h-full w-full flex items-center justify-between gap-1.5 px-3 py-3 border rounded-lg text-left transition focus:outline-none focus:ring-2 focus:ring-primary ${open
                    ? "border-primary ring-2 ring-primary"
                    : "border-border hover:border-gray-400"
                    } bg-white`}
            >
                {selected ? (
                    <span className="flex items-center gap-1.5">
                        <FlagImg code={selected.code} size={16} />
                        <span className="text-sm font-medium text-foreground">+{selected.phoneCode}</span>
                    </span>
                ) : (
                    <span className="text-sm text-gray-400">+---</span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute z-50 mt-1 left-0 w-72 bg-white border border-border rounded-lg shadow-xl overflow-hidden">
                    {/* Search */}
                    <div className="p-2 border-b border-border flex items-center gap-2">
                        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar país o código..."
                            className="flex-1 text-sm outline-none bg-transparent placeholder:text-muted-foreground"
                        />
                        {search && (
                            <button type="button" onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="overflow-y-auto max-h-56">
                        {filtered.length === 0 ? (
                            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                                No se encontró ningún país
                            </div>
                        ) : (
                            filtered.map(country => (
                                <button
                                    key={country.code}
                                    type="button"
                                    onClick={() => handleSelect(country)}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors text-sm ${country.phoneCode === value ? "bg-primary/5 font-medium text-primary" : ""}`}
                                >
                                    <FlagImg code={country.code} size={16} />
                                    <span className="flex-1 truncate">{country.name}</span>
                                    <span className="text-xs text-muted-foreground shrink-0">+{country.phoneCode}</span>
                                    {country.phoneCode === value && (
                                        <span className="text-primary text-xs">✓</span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
