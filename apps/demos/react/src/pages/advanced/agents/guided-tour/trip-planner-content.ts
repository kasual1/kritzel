import type { KritzelIframeContent } from "@kritzel/react-editor";

export interface TripState {
  city: "lisbon" | "tokyo" | "oslo" | null;
  nights: number;
  insurance: boolean;
  booked: boolean;
}

export const INITIAL_TRIP: TripState = { city: null, nights: 3, insurance: false, booked: false };

export const CITIES = {
  lisbon: { name: "Lisbon", country: "Portugal", price: 120 },
  tokyo: { name: "Tokyo", country: "Japan", price: 210 },
  oslo: { name: "Oslo", country: "Norway", price: 180 },
} as const;

export const INSURANCE_PRICE = 39;

export function tripTotal(state: TripState) {
  if (!state.city) return 0;
  return CITIES[state.city].price * state.nights + (state.insurance ? INSURANCE_PRICE : 0);
}

/**
 * A small trip planner. The page keeps its state in `kritzel.state`, so the app can change it with
 * `object.setState()` (that's how the guide "presses" buttons) and the user's own clicks reach the app too.
 */
export const tripPlannerContent: KritzelIframeContent = {
  html: `
    <main class="card">
      <header class="hero" data-kritzel-id="hero">
        <div class="hero-text">
          <span class="eyebrow">Trip planner</span>
          <h2 data-kritzel-id="title">Where to next?</h2>
          <p data-kritzel-id="subtitle">Pick a city to start</p>
        </div>
        <div class="sun"></div>
      </header>
      <section>
        <h3>Destination</h3>
        <div class="cities" role="group" aria-label="Destination" data-kritzel-id="cities">
          <button type="button" data-kritzel-id="city-lisbon" data-city="lisbon"><i style="background:#f59e0b"></i>Lisbon</button>
          <button type="button" data-kritzel-id="city-tokyo" data-city="tokyo"><i style="background:#ef4444"></i>Tokyo</button>
          <button type="button" data-kritzel-id="city-oslo" data-city="oslo"><i style="background:#3b82f6"></i>Oslo</button>
        </div>
      </section>
      <section class="row">
        <h3>Nights</h3>
        <div class="stepper">
          <button type="button" data-kritzel-id="nights-decrease" aria-label="One night less">−</button>
          <output data-kritzel-id="nights">3</output>
          <button type="button" data-kritzel-id="nights-increase" aria-label="One night more">+</button>
        </div>
      </section>
      <section class="row">
        <h3>Travel insurance <small>+$${INSURANCE_PRICE}</small></h3>
        <button type="button" role="switch" aria-checked="false" aria-label="Travel insurance" class="switch" data-kritzel-id="insurance"><span></span></button>
      </section>
      <footer>
        <div class="total">
          <span>Total</span>
          <strong data-kritzel-id="total">—</strong>
        </div>
        <button type="button" class="book" data-kritzel-id="book">Book trip</button>
      </footer>
    </main>
  `,
  css: `
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Roboto, system-ui, sans-serif; color: #1f2937; background: transparent; }
    .card { display: flex; flex-direction: column; height: 100vh; overflow: hidden; border-radius: 16px; background: #ffffff; }
    .hero { position: relative; display: flex; align-items: flex-end; height: 112px; padding: 16px 18px; color: #ffffff; background: linear-gradient(135deg, #64748b, #334155); transition: background 400ms ease; overflow: hidden; }
    .hero[data-city="lisbon"] { background: linear-gradient(135deg, #fbbf24, #f97316); }
    .hero[data-city="tokyo"] { background: linear-gradient(135deg, #fb7185, #be123c); }
    .hero[data-city="oslo"] { background: linear-gradient(135deg, #60a5fa, #1d4ed8); }
    .eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.85; }
    h2 { margin: 2px 0 0; font-size: 24px; }
    .hero p { margin: 2px 0 0; font-size: 13px; opacity: 0.9; }
    .sun { position: absolute; top: -26px; right: -18px; width: 110px; height: 110px; border-radius: 50%; background: rgba(255, 255, 255, 0.22); }
    section { padding: 12px 18px 0; }
    h3 { margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #4b5563; }
    h3 small { font-weight: 500; color: #9ca3af; }
    .row { display: flex; align-items: center; justify-content: space-between; }
    .row h3 { margin: 0; }
    .cities { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
    .cities button { display: flex; align-items: center; justify-content: center; gap: 6px; height: 36px; border: 1px solid #e5e7eb; border-radius: 10px; background: #ffffff; color: #374151; font: inherit; font-size: 13px; font-weight: 600; transition: all 200ms ease; }
    .cities i { width: 8px; height: 8px; border-radius: 50%; }
    .cities button.active { border-color: #0ea5e9; background: #e0f2fe; color: #0369a1; box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.25); }
    .stepper { display: flex; align-items: center; gap: 10px; }
    .stepper button { width: 32px; height: 32px; border: 1px solid #e5e7eb; border-radius: 9px; background: #ffffff; font: inherit; font-size: 17px; color: #374151; }
    output { min-width: 22px; text-align: center; font-size: 16px; font-weight: 700; transition: transform 160ms ease; }
    output.bump { transform: scale(1.3); }
    .switch { position: relative; width: 44px; height: 26px; padding: 0; border: 0; border-radius: 13px; background: #d1d5db; transition: background 200ms ease; }
    .switch span { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: #ffffff; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2); transition: transform 200ms ease; }
    .switch[aria-checked="true"] { background: #0ea5e9; }
    .switch[aria-checked="true"] span { transform: translateX(18px); }
    footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: auto; padding: 14px 18px 18px; border-top: 1px solid #f1f5f9; }
    .total { display: flex; flex-direction: column; }
    .total span { font-size: 12px; color: #6b7280; }
    .total strong { font-size: 22px; }
    .book { height: 42px; padding: 0 20px; border: 0; border-radius: 12px; background: #0ea5e9; color: #ffffff; font: inherit; font-size: 14px; font-weight: 700; transition: background 200ms ease; }
    .book:disabled { background: #cbd5e1; }
    .book.done { background: #16a34a; }
  `,
  script: `
    const CITIES = ${JSON.stringify(CITIES)};
    const $ = id => document.querySelector('[data-kritzel-id="' + id + '"]');
    let previousNights = null;
    const read = () => Object.assign(${JSON.stringify(INITIAL_TRIP)}, kritzel.state || {});
    const render = () => {
      const state = read();
      const city = state.city ? CITIES[state.city] : null;
      $('hero').dataset.city = state.city || '';
      $('title').textContent = city ? city.name : 'Where to next?';
      $('subtitle').textContent = city ? city.country + ' · $' + city.price + ' per night' : 'Pick a city to start';
      document.querySelectorAll('[data-city]').forEach(button => button.classList.toggle('active', button.dataset.city === state.city));
      $('nights').textContent = String(state.nights);
      if (previousNights !== null && previousNights !== state.nights) {
        $('nights').classList.add('bump');
        setTimeout(() => $('nights').classList.remove('bump'), 160);
      }
      previousNights = state.nights;
      $('insurance').setAttribute('aria-checked', String(state.insurance));
      const total = city ? city.price * state.nights + (state.insurance ? ${INSURANCE_PRICE} : 0) : 0;
      $('total').textContent = city ? '$' + total.toLocaleString('en-US') : '—';
      $('book').disabled = !city;
      $('book').classList.toggle('done', state.booked);
      $('book').textContent = state.booked ? 'Booked ✓' : 'Book trip';
    };
    const update = patch => { kritzel.setState(Object.assign(read(), patch)); render(); };
    document.querySelectorAll('[data-city]').forEach(button => button.addEventListener('click', () => update({ city: button.dataset.city, booked: false })));
    $('nights-decrease').addEventListener('click', () => update({ nights: Math.max(1, read().nights - 1), booked: false }));
    $('nights-increase').addEventListener('click', () => update({ nights: Math.min(30, read().nights + 1), booked: false }));
    $('insurance').addEventListener('click', () => update({ insurance: !read().insurance, booked: false }));
    $('book').addEventListener('click', () => { if (read().city) update({ booked: true }); });
    addEventListener('kritzelstatechange', render);
    render();
  `,
};
