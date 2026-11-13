import type { UpdrawIframeContent } from '@updraw/angular-editor';

export const iframeElementsContent: UpdrawIframeContent = {
  html: `
    <main class="card">
      <header>
        <h2 data-updraw-id="title">Team plan</h2>
        <a data-updraw-id="details-link" href="#details">Details</a>
      </header>
      <div class="periods" role="group" aria-label="Billing period">
        <button data-updraw-id="monthly" class="period active" type="button">Monthly</button>
        <button data-updraw-id="yearly" class="period" type="button">Yearly</button>
      </div>
      <div class="seats">
        <span class="label">Seats</span>
        <button data-updraw-id="seats-decrease" class="step" type="button" aria-label="Remove a seat">−</button>
        <output data-updraw-id="seats-count">3</output>
        <button data-updraw-id="seats-increase" class="step" type="button" aria-label="Add a seat">+</button>
      </div>
      <p class="total"><span class="label">Total</span> <strong data-updraw-id="total">$36 / month</strong></p>
      <button data-updraw-id="checkout" class="checkout" type="button">Checkout</button>
    </main>
  `,
  css: `
    body { display: flex; margin: 0; font-family: Roboto, system-ui, sans-serif; color: #202124; background: transparent; }
    .card { display: flex; flex-direction: column; gap: 14px; width: 100%; height: 100%; padding: 18px; box-sizing: border-box; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff; }
    header { display: flex; align-items: baseline; justify-content: space-between; }
    h2 { margin: 0; font-size: 18px; }
    a { color: #4a7dff; font-size: 13px; }
    .periods { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 3px; border-radius: 9px; background: #f3f4f6; }
    .period { height: 30px; border: 0; border-radius: 7px; background: transparent; color: #5f6368; font: inherit; font-size: 13px; font-weight: 600; }
    .period.active { background: #ffffff; color: #4a7dff; box-shadow: 0 1px 4px rgba(32, 33, 36, 0.12); }
    .seats { display: flex; align-items: center; gap: 10px; }
    .label { flex: 1; color: #5f6368; font-size: 13px; }
    .step { width: 30px; height: 30px; border: 1px solid #dadce0; border-radius: 8px; background: #ffffff; font: inherit; font-size: 16px; }
    output { min-width: 24px; text-align: center; font-weight: 700; }
    .total { display: flex; margin: 0; }
    .checkout { margin-top: auto; height: 40px; border: 0; border-radius: 9px; background: #4a7dff; color: #ffffff; font: inherit; font-size: 14px; font-weight: 700; }
  `,
  script: `
    const plan = { seats: 3, yearly: false };
    const $ = id => document.querySelector('[data-updraw-id="' + id + '"]');
    const render = () => {
      $('seats-count').textContent = String(plan.seats);
      $('total').textContent = plan.yearly ? '$' + plan.seats * 120 + ' / year' : '$' + plan.seats * 12 + ' / month';
      $('monthly').classList.toggle('active', !plan.yearly);
      $('yearly').classList.toggle('active', plan.yearly);
    };
    $('seats-decrease').addEventListener('click', () => { plan.seats = Math.max(1, plan.seats - 1); render(); });
    $('seats-increase').addEventListener('click', () => { plan.seats = Math.min(99, plan.seats + 1); render(); });
    $('monthly').addEventListener('click', () => { plan.yearly = false; render(); });
    $('yearly').addEventListener('click', () => { plan.yearly = true; render(); });
    $('checkout').addEventListener('click', () => { $('checkout').textContent = 'Ordered'; });
    render();
  `,
};
