"use client"

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react"
import { Check, ChevronDown, MapPin, Search, X } from "lucide-react"
import ReactCountryFlag from "react-country-flag"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { COUNTRIES } from "@/lib/countries"
import s from "./country-picker.module.css"

export { COUNTRIES } from "@/lib/countries"

type Country = (typeof COUNTRIES)[number]
const searchable = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
const dialDigits = (country: Country) => country.phoneCode.replace(/\D/g, "")

function FlagImg({ code }: { code: string }) {
  return (
    <ReactCountryFlag
      countryCode={code}
      svg
      className={s.flag}
      aria-hidden="true"
    />
  )
}

interface CountrySearchProps {
  selected?: Country
  onSelect: (country: Country) => void
  children: ReactNode
  className?: string
  id?: string
  error?: boolean
  disabled?: boolean
  describedBy?: string
  label?: string
  phone?: boolean
  onClear?: () => void
}

function CountrySearch({
  selected,
  onSelect,
  children,
  className = "",
  id,
  error = false,
  disabled = false,
  describedBy,
  label,
  phone = false,
  onClear
}: CountrySearchProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [active, setActive] = useState(0)
  const [portalHost, setPortalHost] = useState<HTMLElement | undefined>()
  const input = useRef<HTMLInputElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const listId = useId()
  const filtered = useMemo(() => {
    const query = searchable(search.trim())
    return COUNTRIES.filter(
      (country) =>
        searchable(country.name).includes(query) ||
        (phone &&
          (country.phoneCode.includes(query.replace(/^\+/, "")) ||
            dialDigits(country).includes(query.replace(/^\+/, ""))))
    )
  }, [search, phone])
  useEffect(() => {
    if (open)
      list.current
        ?.querySelector<HTMLElement>("[data-active=true]")
        ?.scrollIntoView({ block: "nearest" })
  }, [open, active])
  function changeOpen(value: boolean) {
    if (value)
      setPortalHost(
        trigger.current?.closest<HTMLElement>('[data-slot="dialog-content"]') ||
          undefined
      )
    setOpen(value)
    setSearch("")
    setActive(
      value
        ? Math.max(
            0,
            COUNTRIES.findIndex((country) => country.code === selected?.code)
          )
        : 0
    )
  }
  function choose(country: Country) {
    onSelect(country)
    changeOpen(false)
  }
  return (
    <div
      className={`${s.container} ${className} ${onClear && selected ? s.clearable : ""}`}
    >
      <Popover open={open} onOpenChange={changeOpen}>
        <PopoverTrigger asChild>
          <button
            ref={trigger}
            id={id}
            type="button"
            className={`${s.trigger} ${phone ? s.phoneTrigger : ""}`}
            aria-invalid={error || undefined}
            aria-describedby={describedBy}
            aria-label={label}
            disabled={disabled}
          >
            {children}
            <ChevronDown size={16} className={s.chevron} aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          container={portalHost}
          data-country-menu="true"
          className={`${s.menu} ${phone ? s.phoneMenu : ""}`}
          align="start"
          sideOffset={6}
          collisionPadding={16}
          onEscapeKeyDown={(event) => {
            event.preventDefault()
            changeOpen(false)
          }}
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            input.current?.focus()
          }}
          aria-label={phone ? "Elegir prefijo telefónico" : "Elegir país"}
        >
          <div className={s.search}>
            <Search size={17} aria-hidden="true" />
            <input
              ref={input}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setActive(0)
              }}
              placeholder={phone ? "Buscar país o código…" : "Buscar país…"}
              aria-label={
                phone ? "Buscar país o código telefónico" : "Buscar país"
              }
              role="combobox"
              aria-autocomplete="list"
              aria-expanded="true"
              aria-controls={listId}
              aria-activedescendant={
                filtered[active]
                  ? `${listId}-${filtered[active].code}`
                  : undefined
              }
              autoComplete="off"
              data-no-auto-caps="true"
              onKeyDown={(event) => {
                if (
                  ["ArrowDown", "ArrowUp", "Home", "End", "Enter"].includes(
                    event.key
                  ) &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault()
                  if (event.key === "ArrowDown")
                    setActive((index) =>
                      Math.min(filtered.length - 1, index + 1)
                    )
                  else if (event.key === "ArrowUp")
                    setActive((index) => Math.max(0, index - 1))
                  else if (event.key === "Home") setActive(0)
                  else if (event.key === "End") setActive(filtered.length - 1)
                  else if (filtered[active]) choose(filtered[active])
                }
              }}
            />
          </div>
          <div
            ref={list}
            className={s.list}
            id={listId}
            role="listbox"
            aria-label={phone ? "Prefijos telefónicos" : "Países"}
          >
            {filtered.length ? (
              filtered.map((country, index) => (
                <button
                  key={country.code}
                  id={`${listId}-${country.code}`}
                  type="button"
                  role="option"
                  tabIndex={-1}
                  aria-selected={selected?.code === country.code}
                  data-active={active === index}
                  className={s.option}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(country)}
                  onMouseDown={(event) => event.preventDefault()}
                >
                  <FlagImg code={country.code} />
                  <span>{country.name}</span>
                  {phone && <small>+{country.phoneCode}</small>}
                  {selected?.code === country.code && (
                    <Check size={16} className={s.check} aria-hidden="true" />
                  )}
                </button>
              ))
            ) : (
              <p className={s.empty} role="status">
                No se encontró ningún país.
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {onClear && selected && (
        <button
          type="button"
          aria-label="Quitar país"
          className={s.clearCountry}
          disabled={disabled}
          onClick={() => {
            onClear()
            changeOpen(false)
            trigger.current?.focus()
          }}
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

interface CountryPickerProps {
  value: string
  onChange: (countryName: string, phoneCode?: string) => void
  placeholder?: string
  className?: string
  syncPhoneCode?: boolean
  id?: string
  error?: boolean
  disabled?: boolean
  describedBy?: string
}

export function CountryPicker({
  value,
  onChange,
  placeholder = "Selecciona tu país",
  className = "",
  syncPhoneCode = false,
  id,
  error = false,
  disabled,
  describedBy
}: CountryPickerProps) {
  const selected = COUNTRIES.find((country) => country.name === value)
  return (
    <CountrySearch
      selected={selected}
      onSelect={(country) =>
        onChange(country.name, syncPhoneCode ? country.phoneCode : undefined)
      }
      onClear={() => onChange("", "")}
      className={className}
      id={id}
      error={error}
      disabled={disabled}
      describedBy={describedBy}
    >
      <MapPin size={18} className={s.pin} aria-hidden="true" />
      {selected ? (
        <>
          <FlagImg code={selected.code} />
          <span className={s.name}>{selected.name}</span>
        </>
      ) : (
        <span className={s.placeholder}>{placeholder}</span>
      )}
    </CountrySearch>
  )
}

interface PhoneCodePickerProps {
  label?: string
  value: string
  onChange: (phoneCode: string, countryCode: string) => void
  className?: string
  countryCode?: string
  id?: string
  error?: boolean
  disabled?: boolean
  describedBy?: string
}

export function PhoneCodePicker({
  label,
  value,
  onChange,
  className = "",
  countryCode,
  id,
  error,
  disabled,
  describedBy
}: PhoneCodePickerProps) {
  const selected =
    COUNTRIES.find(
      (country) => country.code === countryCode && country.phoneCode === value
    ) || COUNTRIES.find((country) => country.phoneCode === value)
  return (
    <CountrySearch
      selected={selected}
      onSelect={(country) => onChange(country.phoneCode, country.code)}
      className={className}
      id={id}
      error={error}
      disabled={disabled}
      describedBy={describedBy}
      phone
      label={
        label || `Prefijo telefónico: ${selected?.name || "seleccionar país"}`
      }
    >
      {selected && <FlagImg code={selected.code} />}
      <span className={s.dial}>
        {selected ? `+${selected.phoneCode}` : "+…"}
      </span>
    </CountrySearch>
  )
}
