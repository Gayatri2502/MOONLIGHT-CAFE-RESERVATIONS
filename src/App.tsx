import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { ArrowDownRight, ArrowRight, CalendarDays, Clock3, MapPin, Menu, Search, X } from 'lucide-react'
import type { FloorTable } from '@/components/ui/table-floor'
import type { Dish } from '@/components/ui/dish-orbit-carousel'
import type { ConveyorDish } from '@/components/ui/sushi-conveyor-menu'
import './index.css'
import './sections/cafe.css'

const TableFloor = lazy(async () => {
  const module = await import('@/components/ui/table-floor')
  return { default: module.TableFloor }
})
const DishOrbitCarousel = lazy(() => import('@/components/ui/dish-orbit-carousel'))
const SushiConveyorMenu = lazy(() => import('@/components/ui/sushi-conveyor-menu'))

const signatureDishes: Dish[] = [
  {
    title: 'Char grill',
    subtitle: 'Ribeye',
    label: 'Ribeye frites',
    image: '/images/orbit-ribeye.webp',
    alt: 'Grilled ribeye with fries, broccoli and a pot of ketchup on a dark plate',
    rating: 4.9,
    chef: 'Chef Mara Lind',
    kitchen: 'Ember Counter, Harbour St',
    description: 'Dry-aged for 28 days, seared over charcoal and rested in brown butter. Thin fries, charred greens.',
    likes: 96,
    ingredients: ['Ribeye', 'Fries', 'Broccoli', 'Green beans', 'Smoked ketchup'],
    accent: '#C8102E',
  },
  {
    title: 'Garden',
    subtitle: 'Salmon',
    label: 'Garden salmon salad',
    image: '/images/orbit-salmon.webp',
    alt: 'Leafy salad with cured salmon, avocado and cucumber on a white plate',
    rating: 4.3,
    chef: 'Chef Teo Ashe',
    kitchen: 'The Greenhouse Table',
    description: 'Citrus-cured salmon over rocket, frisée and avocado, with cucumber ribbons and a dill dressing.',
    likes: 71,
    ingredients: ['Cured salmon', 'Avocado', 'Rocket', 'Cucumber', 'Dill'],
    accent: '#C8102E',
  },
  {
    title: 'Black lentil',
    subtitle: 'Sea bass',
    label: 'Lentil sea bass',
    image: '/images/orbit-sea-bass.webp',
    alt: 'Seared sea bass with sesame on black lentils, a soft egg and carrots',
    rating: 4.6,
    chef: 'Chef Ilse Noor',
    kitchen: 'Saltwater Kitchen',
    description: 'Crisp-skin sea bass on beluga lentils with a jammy egg, glazed carrots and a soy-honey jus.',
    likes: 88,
    ingredients: ['Sea bass', 'Beluga lentils', 'Soft egg', 'Carrot', 'Sesame'],
    accent: '#C8102E',
  },
  {
    title: 'Summer',
    subtitle: 'Melon',
    label: 'Summer melon salad',
    image: '/images/orbit-melon.webp',
    alt: 'Melon and cured ham salad with rocket and cherry tomatoes on a white plate',
    rating: 4.5,
    chef: 'Chef Rafa Okoye',
    kitchen: 'Pergola Café',
    description: 'Cantaloupe, cured ham and blistered tomatoes, tossed with rocket and a squeeze of lime.',
    likes: 64,
    ingredients: ['Cantaloupe', 'Cured ham', 'Cherry tomato', 'Rocket', 'Lime'],
    accent: '#C8102E',
  },
  {
    title: 'Sunny',
    subtitle: 'Side up',
    label: 'Sunny side up',
    image: '/images/orbit-egg.webp',
    alt: 'A fried egg with a bright yolk on a white plate',
    rating: 4.7,
    chef: 'Chef June Park',
    kitchen: 'Morning Room',
    description: 'One farm egg, basted in brown butter until the edges lace and the yolk just sets. Breakfast, done right.',
    likes: 120,
    ingredients: ['Farm egg', 'Brown butter', 'Sea salt', 'Black pepper'],
    accent: '#C8102E',
  },
]

const conveyorDishes: ConveyorDish[] = [
  {
    id: 'salmon-nigiri',
    name: 'Salmon nigiri',
    price: '$4.20',
    tier: 2,
    description: 'Salmon served over seasoned rice.',
    details: ['2 pieces'],
    image: '/images/conveyor-1.webp',
  },
  {
    id: 'tuna-nigiri',
    name: 'Tuna nigiri',
    price: '$6.80',
    tier: 4,
    description: 'Tuna with warm rice and a touch of soy.',
    details: ['2 pieces'],
    image: '/images/conveyor-2.webp',
  },
  {
    id: 'ebi-nigiri',
    name: 'Ebi nigiri',
    price: '$4.20',
    tier: 2,
    description: 'Poached shrimp served over seasoned rice.',
    details: ['2 pieces'],
    image: '/images/conveyor-3.webp',
  },
  {
    id: 'california-roll',
    name: 'California roll',
    price: '$5.40',
    tier: 3,
    description: 'Crab, avocado, and cucumber, rolled in orange tobiko.',
    details: ['4 pieces'],
    image: '/images/conveyor-4.webp',
  },
  {
    id: 'dragon-roll',
    name: 'Dragon roll',
    price: '$8.50',
    tier: 5,
    description: 'Shrimp tempura roll with avocado and eel sauce.',
    details: ['4 pieces'],
    image: '/images/conveyor-5.webp',
  },
  {
    id: 'tamago',
    name: 'Tamago nigiri',
    price: '$3.20',
    tier: 1,
    description: 'Sweet rolled omelette with seasoned rice and nori.',
    details: ['2 pieces'],
    image: '/images/conveyor-6.webp',
  },
  {
    id: 'edamame',
    name: 'Salted edamame',
    price: '$3.20',
    tier: 1,
    description: 'Steamed soybeans finished with flaky salt.',
    details: ['1 bowl'],
    image: '/images/conveyor-7.webp',
  },
  {
    id: 'mochi',
    name: 'Mochi ice cream',
    price: '$5.40',
    tier: 3,
    description: 'Matcha and strawberry mochi ice cream.',
    details: ['2 pieces'],
    image: '/images/conveyor-8.webp',
  },
]

const conveyorLegend = { 1: '$3.20', 2: '$4.20', 3: '$5.40', 4: '$6.80', 5: '$8.50' }
const reservationTimes = ['6:00 pm', '6:30 pm', '7:00 pm', '7:30 pm', '8:00 pm', '8:30 pm']
const bookedTables = {
  '6:00 pm': ['t4'],
  '6:30 pm': ['t3', 't7'],
  '7:00 pm': ['t7', 't8'],
  '7:30 pm': ['t4', 't5'],
  '8:00 pm': ['t1', 't3', 't6'],
  '8:30 pm': ['t2', 't6'],
}
const tables: FloorTable[] = [
  { id: 't1', label: '1', x: 80, y: 92, seats: 2, shape: 'round', joinWith: 't2' },
  { id: 't2', label: '2', x: 180, y: 92, seats: 2, shape: 'round', joinWith: 't1' },
  { id: 't3', label: '3', x: 310, y: 92, seats: 4, shape: 'square' },
  { id: 't4', label: '4', x: 490, y: 96, seats: 6, shape: 'long' },
  { id: 't5', label: '5', x: 90, y: 244, seats: 4, shape: 'square' },
  { id: 't6', label: '6', x: 250, y: 244, seats: 2, shape: 'round', joinWith: 't7' },
  { id: 't7', label: '7', x: 350, y: 244, seats: 2, shape: 'round', joinWith: 't6' },
  { id: 't8', label: '8', x: 500, y: 244, seats: 4, shape: 'square' },
]

type TableSelection = {
  tableIds: string[]
  party: number
  time: string
}

type TablePreview = TableSelection & { date: string }

function localDateValue() {
  const date = new Date()
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 10)
}

function maxDateValue() {
  const date = new Date()
  date.setMonth(date.getMonth() + 6)
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 10)
}

export default function App() {
  const path = window.location.pathname.replace(/\/$/, '') || '/'
  const isHome = path === '/'
  const [panel, setPanel] = useState<'menu' | 'search' | null>(null)
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (panel === 'search') searchRef.current?.focus()
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setPanel(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [panel])
  const searchItems = [
    ...signatureDishes.map(d => ({ name: d.label || `${d.title} ${d.subtitle}`, details: `${d.description} ${d.ingredients?.join(' ') || ''}`, href: '/menu#signatures' })),
    ...conveyorDishes.map(d => ({ name: d.name, details: d.description, href: '/menu#kaiten' })),
    { name: 'Reserve a table', details: 'date time party floor plan booking', href: '/reservations' },
    { name: 'About Moonlight', details: 'story japanese dining', href: '/about' },
    { name: 'Visit', details: 'location contact opening hours', href: '/visit' },
  ]
  const results = query.trim() ? searchItems.filter(item => `${item.name} ${item.details}`.toLowerCase().includes(query.trim().toLowerCase())) : []
  const [reservationDate, setReservationDate] = useState(localDateValue)
  const [tablePreview, setTablePreview] = useState<TablePreview | null>(null)
  const [dishPreview, setDishPreview] = useState('')
  const [orderPreview, setOrderPreview] = useState('')

  const handleTablePreview = async (selection: TableSelection) => {
    if (!reservationDate || reservationDate < localDateValue() || reservationDate > maxDateValue()) {
      throw new Error('Choose a date within the next six months before previewing your table.')
    }
    setTablePreview({ ...selection, date: reservationDate })
  }

  const addDishToPreview = (dish: ConveyorDish) => {
    setOrderPreview(`${dish.name} added to your order preview. No order was submitted.`)
  }

  const addSignatureToPreview = (dish: Dish) => {
    setDishPreview(`${dish.title} ${dish.subtitle} added to your order preview. No order was submitted.`)
  }

  const previewDishVideo = (dish: Dish) => {
    setDishPreview(`A video preview for ${dish.title} ${dish.subtitle} is not available.`)
  }

  return (
    <div className="cafe-site" id="top">
      {!isHome && <header className="moonlight-page-nav"><a href="/" className="moonlight-page-logo">MOONLIGHT</a><div><button type="button" onClick={() => setPanel('search')} aria-label="Search"><Search size={21} /></button><button type="button" onClick={() => setPanel('menu')} aria-label="Open menu"><Menu size={23} /></button></div></header>}
      {panel && <div className="moonlight-overlay" onClick={() => setPanel(null)}><div className="moonlight-panel" role="dialog" aria-modal="true" aria-label={panel === 'menu' ? 'Navigation' : 'Search Moonlight'} onClick={e => e.stopPropagation()}><div className="moonlight-panel-top"><span>{panel === 'menu' ? 'EXPLORE MOONLIGHT' : 'FIND SOMETHING'}</span><button type="button" onClick={() => setPanel(null)} aria-label="Close"><X size={22} /></button></div>{panel === 'menu' ? <nav className="moonlight-panel-links" aria-label="Main navigation"><a href="/">Home <ArrowRight /></a><a href="/menu">The menu <ArrowRight /></a><a href="/about">Our story <ArrowRight /></a><a href="/reservations">Reservations <ArrowRight /></a><a href="/visit">Visit <ArrowRight /></a></nav> : <div className="moonlight-search"><label htmlFor="site-search">Search dishes and pages</label><div className="moonlight-search-input"><Search size={20} /><input ref={searchRef} id="site-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Try salmon or reservations" /></div>{query.trim() ? <div className="moonlight-search-results" aria-live="polite">{results.length ? results.map(item => <a key={item.name} href={item.href}><span>{item.name}</span><ArrowRight size={17} /></a>) : <p>No matches found. Try another search.</p>}</div> : <p>Search the sample menu, our story, or reservations.</p>}</div>}</div></div>}
      <main>
      {isHome && <section className="moonlight-featured" id="menu" aria-label="Signature dishes">
        <h1 className="sr-only">Moonlight Japanese dining</h1>
        <Suspense fallback={<div className="moonlight-featured-fallback" aria-busy="true">Loading menu…</div>}>
          <DishOrbitCarousel
            className="moonlight-featured-orbit"
            dishes={signatureDishes}
            height="100svh"
            backdrop="/images/orbit-room.webp"
            loop={false}
            onSearch={() => setPanel('search')}
            onMenu={() => setPanel('menu')}
            onPlay={previewDishVideo}
            onOrder={addSignatureToPreview}
          />
        </Suspense>
        <p className="moonlight-preview-note" role="status" aria-live="polite">
          {dishPreview || 'Dish names, ratings, chef details, and likes are illustrative sample content.'}
        </p>
      </section>}

      {(isHome || path === "/about") && <section className="moonlight-story" id="about">
        <div className="moonlight-story-mark" aria-hidden="true">
          <ArrowDownRight size={25} strokeWidth={1.3} />
        </div>
        <div className="moonlight-story-heading">
          <p className="moonlight-kicker">MOONLIGHT · JAPANESE DINING CONCEPT</p>
          <h2>Good food.<br /><span>Good company.</span></h2>
        </div>
        <div className="moonlight-story-copy">
          <p>
            From the moving belt to the chef’s counter, Moonlight is a restaurant concept built
            around sharing a few plates and taking your time.
          </p>
          <a href="/menu#kaiten">See the menu <ArrowRight size={15} aria-hidden="true" /></a>
        </div>
      </section>}

      {path === "/menu" && <section className="moonlight-menu-list" id="signatures"><p className="moonlight-kicker">THE MENU · SAMPLE DISHES</p><h1>Something for <span>everyone.</span></h1><p>Explore our illustrative signature dishes and sushi plates.</p><div className="moonlight-dish-grid">{signatureDishes.map(dish => <article key={dish.label}><img src={dish.image} alt={dish.alt || dish.label} /><div><h2>{dish.label}</h2><p>{dish.description}</p><small>{dish.ingredients?.join(" · ")}</small></div></article>)}</div></section>}

      {(isHome || path === "/menu") && <section className="moonlight-belt" id="kaiten">
        <header className="moonlight-section-heading moonlight-belt-heading">
          <div>
            <p className="moonlight-kicker">THE KAITEN COUNTER</p>
            <h2>Take a plate.<br /><span>Stay awhile.</span></h2>
          </div>
          <p>Pick a plate from the belt to see its details. The menu and prices shown are samples for this concept.</p>
        </header>
        <Suspense fallback={<div className="moonlight-belt-fallback" aria-busy="true">Loading the belt…</div>}>
          <SushiConveyorMenu
            items={conveyorDishes}
            legend={conveyorLegend}
            eyebrow="MOONLIGHT · SAMPLE MENU"
            heading="A little something for the table."
            caption="Select a plate as it comes around to view its ingredients and sample price."
            autoplay
            interval={5000}
            onAdd={addDishToPreview}
            labels={{ add: 'Add to order preview', close: 'Close', previous: 'Previous plate', next: 'Next plate' }}
            action={
              <a className="moonlight-belt-cta" href="/reservations">
                Reserve a table <ArrowRight size={15} aria-hidden="true" />
              </a>
            }
          />
        </Suspense>
        <p className="moonlight-preview-note" role="status" aria-live="polite">
          {orderPreview || 'Order preview only. No food order is sent to a restaurant.'}
        </p>
      </section>}

      {(isHome || path === "/reservations") && <section className="moonlight-reserve" id="reserve">
        <div className="moonlight-reserve-copy">
          <p className="moonlight-kicker">PLAN YOUR VISIT</p>
          <h2>Choose your<br /><span>place at the table.</span></h2>
          <p>
            Select a date, time, party size, and an available table. This interactive preview does
            not check live availability or submit a booking.
          </p>
          <label className="moonlight-date-field" htmlFor="reservation-date">
            <span><CalendarDays size={16} aria-hidden="true" /> Date</span>
            <input
              id="reservation-date"
              type="date"
              min={localDateValue()}
              max={maxDateValue()}
              value={reservationDate}
              onChange={(event) => {
                setReservationDate(event.currentTarget.value)
                setTablePreview(null)
              }}
            />
          </label>
          <p className="moonlight-reserve-note">
            <Clock3 size={16} aria-hidden="true" />
            Sample evening times; availability is not live.
          </p>
          <p className="moonlight-reserve-note">
            <MapPin size={16} aria-hidden="true" />
            Restaurant location details are not part of this concept.
          </p>
          {tablePreview && (
            <div className="moonlight-confirmation" role="status" aria-live="polite">
              <span>TABLE PREVIEW</span>
              <strong>
                Table {tablePreview.tableIds.join(' + ')} · {tablePreview.party}{' '}
                {tablePreview.party === 1 ? 'guest' : 'guests'} · {tablePreview.time}
              </strong>
              <span>{new Intl.DateTimeFormat('en', { dateStyle: 'long' }).format(new Date(`${tablePreview.date}T12:00:00`))}</span>
              <small>This is only a preview. No reservation was sent.</small>
            </div>
          )}
        </div>
        <div className="moonlight-floor">
          <Suspense fallback={<div className="moonlight-floor-fallback" aria-busy="true">Loading the floor plan…</div>}>
            <TableFloor
              title="Choose a table"
              tables={tables}
              times={reservationTimes}
              booked={bookedTables}
              maxParty={8}
              theme="light"
              onChange={() => setTablePreview(null)}
              onConfirm={handleTablePreview}
            />
          </Suspense>
          <p className="moonlight-floor-note">
            The floor plan and availability are illustrative sample data.
          </p>
        </div>
      </section>}
      {path === '/visit' && <section className="moonlight-visit"><p className="moonlight-kicker">PLAN YOUR VISIT</p><h1>Come as you are.<br /><span>Stay awhile.</span></h1><p>Moonlight is a Japanese dining concept. A restaurant address, opening hours and contact details have not been provided yet.</p><a className="moonlight-belt-cta" href="/reservations">Explore the table preview <ArrowRight size={15} /></a><a className="moonlight-visit-link" href="/menu">Explore the sample menu <ArrowRight size={15} /></a></section>}
      {!['/', '/menu', '/about', '/reservations', '/visit'].includes(path) && <section className="moonlight-visit"><p className="moonlight-kicker">PAGE NOT FOUND</p><h1>Let’s get you <span>back.</span></h1><p>We couldn’t find that page.</p><a className="moonlight-belt-cta" href="/">Back home <ArrowRight size={15} /></a></section>}
      </main>

      <footer className="moonlight-footer" id="visit">
        <a className="moonlight-wordmark" href="/">MOONLIGHT</a>
        <p>Japanese dining concept · Sample menu and table reservation preview</p>
        <a href="#top" aria-label="Back to top">Back to top <ArrowRight size={15} aria-hidden="true" /></a>
      </footer>
    </div>
  )
}
