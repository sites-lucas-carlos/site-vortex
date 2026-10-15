import '@fontsource-variable/geist'
import '@fontsource/cinzel/500.css'
import '@fontsource/cinzel/600.css'
import './styles.css'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import Lenis from 'lenis'
import { initForm } from './form.js'

gsap.registerPlugin(ScrollTrigger, SplitText)

const $ = (s, el = document) => el.querySelector(s)
const $$ = (s, el = document) => [...el.querySelectorAll(s)]

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
const SVG_ORIGIN = '434 434' // centre of the Vortex symbol viewBox

if (!reduce) document.documentElement.classList.add('motion-ok')
else document.querySelector('.loader')?.classList.add('is-done')

/* ---------------------------------------------------------
   Smooth scroll (Lenis) synced with ScrollTrigger
   --------------------------------------------------------- */
let lenis = null
if (!reduce) {
  lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => lenis.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)
  if (import.meta.env.DEV) window.__lenis = lenis
}

function scrollToTarget(hash) {
  const target = hash === '#inicio' ? 0 : $(hash)
  if (target === null) return
  if (lenis) lenis.scrollTo(target, { offset: hash === '#inicio' ? 0 : -24, duration: 1.4 })
  else if (target === 0) window.scrollTo(0, 0)
  else target.scrollIntoView()
}

/* ---------------------------------------------------------
   Navigation: hide on scroll down, active links, mobile menu
   --------------------------------------------------------- */
function initNav() {
  const nav = $('[data-nav]')
  const menu = $('[data-menu]')
  const toggle = $('[data-menu-toggle]')
  let menuOpen = false

  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate(self) {
      const y = self.scroll()
      nav.classList.toggle('is-solid', y > 40)
      if (menuOpen) return
      nav.classList.toggle('is-hidden', self.direction === 1 && y > 480)
    },
  })

  $$('.nav__links a').forEach((link) => {
    const section = $(link.getAttribute('href'))
    if (!section) return
    ScrollTrigger.create({
      trigger: section,
      start: 'top 45%',
      end: 'bottom 45%',
      onToggle: (self) => link.classList.toggle('is-active', self.isActive),
    })
  })

  function setMenu(open) {
    menuOpen = open
    menu.classList.toggle('is-open', open)
    nav.classList.toggle('menu-open', open)
    nav.classList.remove('is-hidden')
    menu.setAttribute('aria-hidden', String(!open))
    toggle.setAttribute('aria-expanded', String(open))
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu')
    if (lenis) open ? lenis.stop() : lenis.start()
    document.body.style.overflow = open ? 'hidden' : ''
    if (open && !reduce) {
      gsap.fromTo(
        $$('.menu__links a, .menu__cta, .menu__mail', menu),
        { yPercent: 60, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.8, ease: 'expo.out', stagger: 0.05, delay: 0.25 }
      )
    }
  }
  toggle.addEventListener('click', () => setMenu(!menuOpen))
  document.addEventListener('keydown', (e) => e.key === 'Escape' && menuOpen && setMenu(false))

  // every in-page anchor uses the smooth scroller
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const hash = a.getAttribute('href')
      if (hash.length < 2) return
      e.preventDefault()
      if (menuOpen) setMenu(false)
      scrollToTarget(hash)
    })
  })
}

/* ---------------------------------------------------------
   Intro: the symbol draws itself, then the curtain lifts
   --------------------------------------------------------- */
function intro() {
  const loader = $('.loader')
  if (reduce) {
    loader.classList.add('is-done')
    return gsap.timeline()
  }
  const sym = $('.vx-symbol', loader)
  const ring = $('.vx-ring', sym)
  const len = 2 * Math.PI * 421

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
  tl.set(ring, { strokeDasharray: len, strokeDashoffset: len })
    .set($('.loader__mark', loader), { opacity: 1 })
    .to(ring, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' })
    .from(
      $$('.vx-cres', sym),
      { rotation: 160, scale: 0.4, opacity: 0, svgOrigin: SVG_ORIGIN, duration: 1.1, stagger: 0.08 },
      0.1
    )
    .from($('.vx-star', sym), { scale: 0, rotation: -135, svgOrigin: SVG_ORIGIN, duration: 0.8, ease: 'back.out(2)' }, 0.55)
    .to($('.loader__mark', loader), { scale: 0.85, opacity: 0, duration: 0.45, ease: 'power2.in' }, 1.45)
    .to(loader, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.95, ease: 'expo.inOut' }, 1.55)
    .add(() => loader.classList.add('is-done'))
  return tl
}

/* ---------------------------------------------------------
   Hero entrance + pointer tilt + scroll drift
   --------------------------------------------------------- */
function hero(master) {
  const title = $('[data-hero-title]')
  const visual = $('[data-hero-visual]')
  const orbit = $('[data-orbit]')

  if (reduce) return

  const split = SplitText.create(title, { type: 'lines,words', mask: 'lines', linesClass: 'split-line' })
  gsap.set(split.words, { yPercent: 115 })

  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
  tl.to(split.words, { yPercent: 0, duration: 1.3, stagger: 0.07 })
    .fromTo(
      $$('[data-hero-fade]'),
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.1, stagger: 0.1 },
      0.25
    )
    .fromTo(
      visual,
      { opacity: 0, scale: 0.72, rotation: -50 },
      { opacity: 1, scale: 1, rotation: 0, duration: 2, ease: 'expo.out' },
      0.1
    )
  master.add(tl, '-=0.55')

  // the symbol slowly turns away as you leave the hero
  gsap.to(orbit, {
    rotation: 110,
    scale: 0.82,
    yPercent: 12,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 },
  })

  if (finePointer) {
    gsap.set(visual, { transformPerspective: 900 })
    const rx = gsap.quickTo(visual, 'rotationX', { duration: 1.2, ease: 'power3.out' })
    const ry = gsap.quickTo(visual, 'rotationY', { duration: 1.2, ease: 'power3.out' })
    const hx = gsap.quickTo(orbit, 'x', { duration: 1.4, ease: 'power3.out' })
    const hy = gsap.quickTo(orbit, 'y', { duration: 1.4, ease: 'power3.out' })
    $('.hero').addEventListener('pointermove', (e) => {
      const nx = e.clientX / window.innerWidth - 0.5
      const ny = e.clientY / window.innerHeight - 0.5
      ry(nx * 18)
      rx(-ny * 14)
      hx(nx * 24)
      hy(ny * 18)
    })
  }
}

/* ---------------------------------------------------------
   Scroll choreography
   --------------------------------------------------------- */
function scrollScenes() {
  // Section headings: masked line reveal
  $$('[data-split]').forEach((el) => {
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'split-line',
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 110,
          duration: 1.15,
          ease: 'expo.out',
          stagger: 0.1,
          scrollTrigger: { trigger: el, start: 'top 86%', once: true },
        }),
    })
  })

  // Giant wordmark rises letter by letter
  gsap.from('[data-bigword] span', {
    yPercent: 105,
    ease: 'none',
    stagger: 0.07,
    scrollTrigger: { trigger: '[data-bigword]', start: 'top bottom', end: 'bottom 80%', scrub: 0.8 },
  })

  // Light section opens up like a sheet
  gsap.fromTo(
    '[data-paper]',
    { clipPath: 'inset(0% 4% 0% 4% round 48px)' },
    {
      clipPath: 'inset(0% 0% 0% 0% round 36px)',
      ease: 'none',
      scrollTrigger: { trigger: '[data-paper]', start: 'top bottom', end: 'top 35%', scrub: true },
    }
  )

  // Manifesto: words light up as you read
  const manifesto = $('[data-words]')
  const words = SplitText.create(manifesto, { type: 'words', wordsClass: 'w' }).words
  gsap.fromTo(
    words,
    { opacity: 0.14 },
    {
      opacity: 1,
      ease: 'none',
      stagger: 0.1,
      scrollTrigger: { trigger: manifesto, start: 'top 78%', end: 'bottom 42%', scrub: true },
    }
  )

  // Stats
  gsap.from('.stat', {
    y: 60,
    opacity: 0,
    duration: 1.1,
    ease: 'expo.out',
    stagger: 0.08,
    scrollTrigger: { trigger: '.stats', start: 'top 85%', once: true },
  })
  $$('[data-count]').forEach((el) => {
    const end = Number(el.dataset.count)
    if (!end) return
    const obj = { v: 0 }
    gsap.to(obj, {
      v: end,
      duration: 1.8,
      ease: 'power3.out',
      onUpdate: () => (el.textContent = Math.round(obj.v)),
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    })
  })

  // Generic reveals (bento cells, founders, FAQ rows, service rows)
  const reveal = (selector, from) => {
    const els = $$(selector)
    if (!els.length) return
    gsap.set(els, from)
    ScrollTrigger.batch(els, {
      start: 'top 90%',
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, { y: 0, x: 0, opacity: 1, scale: 1, duration: 1.1, ease: 'expo.out', stagger: 0.08, overwrite: true }),
    })
  }
  reveal('.cell[data-reveal]', { y: 70, opacity: 0, scale: 0.97 })
  reveal('.founder[data-reveal]', { y: 40, opacity: 0 })
  reveal('.qa[data-reveal]', { y: 30, opacity: 0 })
  reveal('[data-svc]', { y: 36, opacity: 0 })

  // Image parallax inside bento cells
  $$('[data-parallax]').forEach((wrap) => {
    gsap.fromTo(
      wrap,
      { yPercent: -6 },
      { yPercent: 6, ease: 'none', scrollTrigger: { trigger: wrap.parentElement, scrub: true } }
    )
  })

  // Offer: the zero grows into place while the horizon rises
  gsap.fromTo(
    '[data-offer-big]',
    { scale: 0.62, yPercent: 18, opacity: 0.15 },
    {
      scale: 1,
      yPercent: 0,
      opacity: 1,
      ease: 'none',
      scrollTrigger: { trigger: '[data-offer]', start: 'top 85%', end: 'top 15%', scrub: 1 },
    }
  )
  gsap.fromTo(
    '[data-arc]',
    { yPercent: 14, opacity: 0.2 },
    {
      yPercent: 0,
      opacity: 1,
      ease: 'none',
      scrollTrigger: { trigger: '[data-offer]', start: 'top bottom', end: 'top 10%', scrub: 1 },
    }
  )
  gsap.from('[data-term]', {
    y: 30,
    opacity: 0,
    duration: 1,
    ease: 'expo.out',
    stagger: 0.1,
    scrollTrigger: { trigger: '.offer__terms', start: 'top 88%', once: true },
  })
}

/* ---------------------------------------------------------
   Method: vertical scroll drives a horizontal track (desktop)
   --------------------------------------------------------- */
function method() {
  const section = $('[data-method]')
  const track = $('[data-method-track]')
  const bar = $('[data-method-bar]')
  const mm = gsap.matchMedia()

  mm.add('(min-width: 861px)', () => {
    section.classList.add('is-pinned')
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth)
    gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => gsap.set(bar, { scaleX: self.progress }),
      },
    })
    return () => section.classList.remove('is-pinned')
  })

  mm.add('(max-width: 860px)', () => {
    gsap.from($$('.step', track), {
      y: 50,
      opacity: 0,
      duration: 1,
      ease: 'expo.out',
      stagger: 0.1,
      scrollTrigger: { trigger: track, start: 'top 85%', once: true },
    })
  })
}

/* ---------------------------------------------------------
   Marquee: endless, and it reacts to scroll speed/direction
   --------------------------------------------------------- */
function marquee() {
  const wrap = $('[data-marquee]')
  const first = $('.marquee__track', wrap)
  const clone = first.cloneNode(true)
  clone.setAttribute('aria-hidden', 'true')
  wrap.append(clone)
  wrap.style.display = 'flex'
  if (reduce) return

  const tracks = [first, clone]
  const setX = tracks.map((t) => gsap.quickSetter(t, 'x', 'px'))
  let width = first.offsetWidth
  let pos = 0
  let dir = 1
  let boost = 0
  let active = false

  window.addEventListener('resize', () => (width = first.offsetWidth))
  ScrollTrigger.create({
    trigger: wrap,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => (active = self.isActive),
    onUpdate: (self) => {
      dir = self.direction
      boost = Math.min(Math.abs(self.getVelocity()) / 250, 6)
    },
  })
  gsap.ticker.add((_, dt) => {
    if (!active) return
    pos -= 0.06 * dt * dir * (1 + boost)
    boost *= 0.93
    pos = gsap.utils.wrap(-width, 0, pos)
    setX.forEach((s) => s(pos))
  })
}

/* ---------------------------------------------------------
   Micro-interactions
   --------------------------------------------------------- */
function interactions() {
  if (finePointer && !reduce) {
    // magnetic buttons
    $$('[data-magnetic]').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' })
      const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' })
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect()
        xTo((e.clientX - r.left - r.width / 2) * 0.22)
        yTo((e.clientY - r.top - r.height / 2) * 0.35)
      })
      el.addEventListener('pointerleave', () => {
        gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.4)' })
      })
    })
  }

  if (finePointer) {
    // spotlight border on bento cells
    $$('.cell').forEach((cell) => {
      cell.addEventListener('pointermove', (e) => {
        const r = cell.getBoundingClientRect()
        cell.style.setProperty('--mx', `${e.clientX - r.left}px`)
        cell.style.setProperty('--my', `${e.clientY - r.top}px`)
      })
    })
  }

  // FAQ accordion with animated height (native <details> as the fallback)
  let refreshTimer
  const refreshSoon = () => {
    clearTimeout(refreshTimer)
    refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 550)
  }
  $$('[data-faq] .qa').forEach((qa) => {
    if (qa.open) qa.classList.add('is-open')
    $('summary', qa).addEventListener('click', (e) => {
      e.preventDefault()
      if (qa.classList.contains('is-open')) {
        qa.classList.remove('is-open')
        setTimeout(() => !qa.classList.contains('is-open') && (qa.open = false), reduce ? 0 : 500)
      } else {
        qa.open = true
        requestAnimationFrame(() => requestAnimationFrame(() => qa.classList.add('is-open')))
      }
      refreshSoon()
    })
  })
}

/* ---------------------------------------------------------
   Boot
   --------------------------------------------------------- */
function boot() {
  initNav()
  interactions()
  marquee()
  initForm({
    onSuccess: (done) => {
      if (!reduce) gsap.from(done.children, { y: 24, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08 })
    },
  })

  if (reduce) {
    $('.loader')?.classList.add('is-done')
    return
  }

  if (lenis) lenis.stop()
  const master = intro()
  hero(master)
  master.add(() => lenis && lenis.start(), '-=1')
  scrollScenes()
  method()

  window.addEventListener('load', () => ScrollTrigger.refresh())
}

// Wait for fonts so text splitting measures the final glyphs
const fontsReady = document.fonts?.ready ?? Promise.resolve()
Promise.race([fontsReady, new Promise((r) => setTimeout(r, 2500))]).then(boot)
