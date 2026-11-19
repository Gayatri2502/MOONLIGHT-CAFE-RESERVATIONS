"use client"
import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Armchair, Check, Link2, Loader2, Moon, Sparkles, Sun } from "lucide-react"
import { cn } from "@/lib/utils"

/* ---------- theme shell: toggles the ambient `.dark` class only; chrome colors come from the host's shadcn tokens ---------- */
type Mode = "light" | "dark"
function useMode(theme: "light" | "dark" | "system", onThemeChange?: (m: Mode) => void) {
  const [mode, setMode] = React.useState<Mode>(theme === "dark" ? "dark" : "light")
  React.useEffect(() => {
    if (theme !== "system") { setMode(theme); return }
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const f = () => setMode(mq.matches ? "dark" : "light")
    f(); mq.addEventListener("change", f)
    return () => mq.removeEventListener("change", f)
  }, [theme])
  const toggle = () => setMode((m) => { const n = m === "dark" ? "light" : "dark"; onThemeChange?.(n); return n })
  return { mode, toggle }
}
function ThemeToggle({ mode, onClick }: { mode: Mode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={mode === "dark" ? "Switch to light theme" : "Switch to dark theme"} data-testid="theme-toggle"
      className="grid h-11 w-11 place-items-center rounded-full border border-border bg-muted text-foreground outline-none transition-colors hover:bg-card focus-visible:ring-2 focus-visible:ring-ring">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={mode} initial={{ rotate: -80, opacity: 0, scale: 0.6 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} exit={{ rotate: 80, opacity: 0, scale: 0.6 }} transition={{ duration: 0.22 }}>
          {mode === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}

/* ---------- types ---------- */
export interface FloorTable {
  id: string
  label: string
  /** Centre of the table in room pixels (room is 600 x 340). */
  x: number
  y: number
  seats: number
  shape?: "round" | "square" | "long"
  /** Id of a neighbour this table can be pushed together with. */
  joinWith?: string
}
export interface TableFloorProps {
  tables: FloorTable[]
  times: string[]
  /** Booked table ids per time label. */
  booked: Record<string, string[]>
  maxParty?: number
  title?: string
  theme?: "light" | "dark" | "system"
  onThemeChange?: (mode: Mode) => void
  onChange?: (v: { tableIds: string[]; party: number; time: string } | null) => void
  onConfirm?: (v: { tableIds: string[]; party: number; time: string }) => Promise<void> | void
  className?: string
}

const dims = (t: FloorTable) => (t.shape === "long" ? { w: 132, h: 64 } : t.shape === "square" ? { w: 76, h: 76 } : { w: 64, h: 64 })

export function TableFloor({ tables, times, booked, maxParty = 12, title = "Reserve a table", theme = "system", onThemeChange, onChange, onConfirm, className }: TableFloorProps) {
  const reduce = useReducedMotion()
  const { mode, toggle } = useMode(theme, onThemeChange)
  const [time, setTime] = React.useState(times[1] ?? times[0])
  const [party, setParty] = React.useState(4)
  const [selId, setSelId] = React.useState<string | null>(null)
  const [status, setStatus] = React.useState<"idle" | "busy" | "done">("idle")
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const roomRef = React.useRef<HTMLDivElement>(null)
  const byId = React.useMemo(() => Object.fromEntries(tables.map((t) => [t.id, t])), [tables])
  const isBooked = (id: string) => (booked[time] ?? []).includes(id)

  /* seating options at a given time for a given party size: single tables, or free join-pairs, that hold enough seats */
  const optionsAt = React.useCallback((tm: string, partySize: number) => {
    const bookedIds = new Set(booked[tm] ?? [])
    let n = 0
    const counted = new Set<string>()
    for (const t of tables) {
      if (bookedIds.has(t.id) || counted.has(t.id)) continue
      if (t.seats >= partySize) { n++; counted.add(t.id); continue }
      if (t.joinWith && !bookedIds.has(t.joinWith) && !counted.has(t.joinWith)) {
        const partnerT = byId[t.joinWith]
        if (partnerT && t.seats + partnerT.seats >= partySize) { n++; counted.add(t.id); counted.add(t.joinWith) }
      }
    }
    return n
  }, [tables, booked, byId])
  const timeOptionCounts = React.useMemo(() => Object.fromEntries(times.map((tm) => [tm, optionsAt(tm, party)])), [times, party, optionsAt])
  const bestCount = Math.max(0, ...Object.values(timeOptionCounts))
  const hasVariance = new Set(Object.values(timeOptionCounts)).size > 1

  const sel = selId ? byId[selId] : null
  // seat fitting: the table alone, else pushed together with its free neighbour
  const partner = sel?.joinWith && byId[sel.joinWith] && !isBooked(sel.joinWith) ? byId[sel.joinWith] : null
  const merged = !!(sel && partner && party > sel.seats)
  const capacity = sel ? sel.seats + (merged ? partner!.seats : 0) : 0
  const fits = !!sel && party <= capacity
  const ids = sel ? (merged ? [sel.id, partner!.id] : [sel.id]) : []
  const centre = sel ? (merged ? { x: (sel.x + partner!.x) / 2, y: (sel.y + partner!.y) / 2 } : { x: sel.x, y: sel.y }) : { x: 0, y: 0 }
  const radius = sel ? (merged ? Math.hypot(sel.x - partner!.x, sel.y - partner!.y) / 2 + 40 : Math.max(dims(sel).w, dims(sel).h) / 2 + 6) : 0

  React.useEffect(() => { onChange?.(sel && fits ? { tableIds: ids, party, time } : null) }, [selId, party, time, merged]) // eslint-disable-line
  React.useEffect(() => { if (selId && isBooked(selId)) setSelId(null) }, [time]) // eslint-disable-line

  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 420, damping: 24 }

  /* angle handle: drag around the table to seat people */
  const handleAngle = (party / maxParty) * 360 - 90
  const hr = radius + 36
  const hx = centre.x + Math.cos((handleAngle * Math.PI) / 180) * hr, hy = centre.y + Math.sin((handleAngle * Math.PI) / 180) * hr
  const drag = (e: React.PointerEvent) => {
    if (e.buttons !== 1 || !roomRef.current) return
    const b = roomRef.current.getBoundingClientRect()
    const scale = b.width / 600
    const dx = (e.clientX - b.left) / scale - centre.x, dy = (e.clientY - b.top) / scale - centre.y
    let a = (Math.atan2(dy, dx) * 180) / Math.PI + 90; if (a < 0) a += 360
    const v = Math.round((a / 360) * maxParty)
    setParty(v === 0 ? maxParty : v); setStatus("idle")
  }
  const keys = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); setParty((p) => Math.min(maxParty, p + 1)) }
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); setParty((p) => Math.max(1, p - 1)) }
    if (e.key === "Home") setParty(1); if (e.key === "End") setParty(maxParty)
  }

  const confirm = async () => {
    if (!sel || !fits) return
    setStatus("busy")
    setErrorMessage(null)
    try {
      await onConfirm?.({ tableIds: ids, party, time })
      await new Promise((r) => setTimeout(r, 700))
      setStatus("done")
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "The table preview could not be created.")
      setStatus("idle")
    }
  }

  const chairs = Array.from({ length: party }, (_, i) => i)
  const chairR = radius + 12

  return (
    <div className={cn(mode === "dark" && "dark", "w-full max-w-[660px] rounded-3xl border border-border bg-background p-5 text-foreground shadow-[0_30px_80px_-40px_color-mix(in_oklab,var(--primary)_60%,transparent)] transition-colors duration-300", className)} data-mode={mode}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">Tap a table, then drag the round handle to seat your party.</p>
        </div>
        <ThemeToggle mode={mode} onClick={toggle} />
      </div>

      <div role="radiogroup" aria-label="Time" className="mt-4 flex flex-wrap gap-2">
        {times.map((tm) => {
          const count = timeOptionCounts[tm] ?? 0
          const best = count > 0 && count === bestCount && hasVariance
          return (
            <button key={tm} type="button" role="radio" aria-checked={tm === time} onClick={() => { setTime(tm); setStatus("idle") }}
              aria-label={`${tm}, ${count} seating option${count === 1 ? "" : "s"} for ${party} guest${party === 1 ? "" : "s"}${best ? ", best availability" : ""}`}
              className={cn("relative h-11 min-w-[78px] rounded-full border px-4 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring", tm === time ? "border-transparent text-primary-foreground" : "border-border bg-card text-foreground hover:bg-muted")}>
              {tm === time && <motion.span layoutId="pk-time-pill" className="absolute inset-0 rounded-full bg-primary" transition={spring} />}
              <span className="relative inline-flex items-center gap-1">
                {tm}
                {best && <Sparkles aria-hidden className="h-3 w-3" />}
              </span>
              <span aria-hidden className={cn("absolute -right-1.5 -top-1.5 grid h-5 min-w-[20px] place-items-center rounded-full border px-1 text-[10px] font-bold", tm === time ? "border-primary-foreground/40 bg-primary-foreground text-primary" : "border-border bg-muted text-muted-foreground", count === 0 && "opacity-50")}>
                {count}
              </span>
            </button>
          )
        })}
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">Badge shows seating options for a party of {party}{hasVariance ? <> &middot; <Sparkles className="inline h-3 w-3 align-[-1px]" aria-hidden /> marks the best availability</> : null}.</p>

      <div className="mt-4 overflow-x-auto">
        <div ref={roomRef} className="relative mx-auto select-none overflow-hidden rounded-2xl border border-border bg-card" style={{ width: 600, height: 340, backgroundImage: "radial-gradient(var(--border) 1.2px, transparent 1.4px)", backgroundSize: "22px 22px", touchAction: "none" }} onPointerMove={drag}>
          <div aria-hidden className="absolute left-0 top-0 h-[6px] w-full bg-muted" />
          <div aria-hidden className="absolute bottom-0 right-8 h-[6px] w-20 bg-accent" />
          <span aria-hidden className="absolute bottom-2 right-8 w-20 text-center text-[10px] font-semibold tracking-widest text-muted-foreground">DOOR</span>
          <span aria-hidden className="absolute left-3 top-2 text-[10px] font-semibold tracking-widest text-muted-foreground">WINDOW SIDE</span>

          {/* liquid bridge when two tables are pushed together */}
          <AnimatePresence>
            {merged && sel && partner && (
              <motion.div key="bridge" aria-hidden className="absolute rounded-full bg-accent" style={{ left: Math.min(sel.x, partner.x), top: Math.min(sel.y, partner.y) - 22, width: Math.abs(sel.x - partner.x) || 44, height: Math.abs(sel.y - partner.y) + 44, transformOrigin: "left center" }}
                initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} exit={{ scaleX: 0, opacity: 0 }} transition={spring} />
            )}
          </AnimatePresence>

          {/* chairs */}
          <AnimatePresence>
            {sel && chairs.map((i) => {
              const a = (i / party) * Math.PI * 2 - Math.PI / 2
              return (
                <motion.span key={sel.id + (merged ? "m" : "") + i} aria-hidden className={cn("absolute h-[14px] w-[14px] rounded-full border-2", fits ? "border-primary bg-card" : "border-accent-foreground/40 bg-accent")}
                  style={{ left: centre.x - 7, top: centre.y - 7 }}
                  initial={{ x: 0, y: 0, scale: 0 }} animate={{ x: Math.cos(a) * chairR * (merged ? 1.02 : 1), y: Math.sin(a) * chairR, scale: 1, backgroundColor: i >= capacity ? "var(--destructive, #d64545)" : undefined }}
                  exit={{ x: 0, y: 0, scale: 0 }} transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 20, delay: i * 0.015 }} />
              )
            })}
          </AnimatePresence>

          {tables.map((t) => {
            const d = dims(t), taken = isBooked(t.id), chosen = ids.includes(t.id)
            const tooSmall = !chosen && !taken && t.seats < party && !(t.joinWith && !isBooked(t.joinWith) && t.seats + byId[t.joinWith].seats >= party)
            return (
              <motion.button key={t.id} type="button" data-table={t.id} aria-pressed={chosen} aria-disabled={taken}
                aria-label={`Table ${t.label}, seats ${t.seats}${taken ? `, booked at ${time}` : tooSmall ? ", too small for your party" : ""}`}
                title={taken ? `Booked at ${time}` : `Table ${t.label}, up to ${t.seats}`}
                onClick={() => { if (!taken) { setSelId(t.id); setStatus("idle") } }}
                animate={{ opacity: tooSmall ? 0.42 : 1, scale: chosen ? 1.06 : 1 }} whileHover={taken || reduce ? undefined : { scale: 1.05 }} whileTap={taken || reduce ? undefined : { scale: 0.96 }} transition={spring}
                className={cn("absolute grid place-items-center border-2 text-xs font-bold outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                  t.shape === "round" || !t.shape ? "rounded-full" : "rounded-2xl",
                  taken ? "cursor-not-allowed border-transparent bg-muted text-muted-foreground [background-image:repeating-linear-gradient(135deg,transparent_0_5px,var(--border)_5px_6px)]"
                    : chosen ? "border-primary bg-primary text-primary-foreground shadow-[0_10px_26px_-8px_var(--primary)]" : "border-primary/50 bg-background text-foreground hover:border-primary")}
                style={{ left: t.x - d.w / 2, top: t.y - d.h / 2, width: d.w, height: d.h }}>
                <span className="flex flex-col items-center leading-none"><span>{t.label}</span><span className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-medium opacity-80"><Armchair className="h-3 w-3" />{t.seats}</span></span>
              </motion.button>
            )
          })}

          {/* party handle */}
          <AnimatePresence>
            {sel && (
              <motion.div key="handle" role="slider" tabIndex={0} aria-label="Party size" aria-valuemin={1} aria-valuemax={maxParty} aria-valuenow={party} aria-valuetext={`${party} guests`} onKeyDown={keys}
                onPointerDown={(e) => { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) }} onPointerMove={drag}
                className="absolute grid h-11 w-11 cursor-grab place-items-center rounded-full bg-accent text-sm font-bold text-accent-foreground shadow-[0_8px_20px_-6px_rgba(0,0,0,0.5)] outline-none ring-2 ring-primary active:cursor-grabbing focus-visible:ring-4"
                style={{ touchAction: "none", left: -22, top: -22 }} initial={{ scale: 0, x: hx, y: hy }} animate={{ scale: 1, x: hx, y: hy }} exit={{ scale: 0 }}
                transition={reduce ? { duration: 0 } : { x: { type: "spring", stiffness: 520, damping: 30 }, y: { type: "spring", stiffness: 520, damping: 30 }, scale: { duration: 0.2 } }}>
                {party}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-3 min-h-[24px] text-sm" role="status" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p key={!sel ? "n" : merged ? "m" + party : fits ? "f" + party : "x" + party} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-muted-foreground">
            {!sel ? "Free tables are outlined. Hatched tables are booked at this time."
              : merged ? <span className="inline-flex items-center gap-2 text-foreground"><Link2 className="h-4 w-4 text-primary" />Tables {sel.label} and {partner!.label} pushed together, seats {capacity}.</span>
                : fits ? <span className="text-foreground">Table {sel.label} fits {party}. Room for {capacity - party} more.</span>
                  : <span className="font-medium text-foreground">Table {sel.label} seats up to {capacity}. Pick a larger table or lower the party.</span>}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="mt-3 flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-3">
        <div className="text-sm"><div className="text-xs text-muted-foreground">Your table</div><div className="font-semibold">{sel && fits ? `${ids.map((i) => byId[i].label).join(" + ")} for ${party} at ${time}` : "Not chosen yet"}</div></div>
        <button type="button" disabled={!sel || !fits || status === "busy"} onClick={confirm}
          className={cn("inline-flex h-11 min-w-[150px] items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background", status === "done" ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground hover:brightness-110 active:scale-95 disabled:opacity-40")}>
          {status === "busy" ? <Loader2 className="h-4 w-4 animate-spin" /> : status === "done" ? <Check className="h-4 w-4" /> : null}
          {status === "done" ? "Preview ready" : status === "busy" ? "Preparing" : "Preview table"}
        </button>
      </div>
      {errorMessage && <p role="alert" className="mt-3 text-sm text-destructive">{errorMessage}</p>}
    </div>
  )
}
