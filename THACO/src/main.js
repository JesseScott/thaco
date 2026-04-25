import './style.css'
import OBR from '@owlbear-rodeo/sdk'
import { clamp, calculateThreshold, isHit, impliedThaco } from './thaco.js'

const app = document.querySelector('#app')

app.innerHTML = `
  <main class="panel">
    <header class="hero-panel">
      <h1>THACO Calculator</h1>
      <p>Enter your THAC0, target Armor Class, and attack bonus to calculate the roll threshold.</p>
    </header>

    <div class="section-divider"></div>

    <form id="calculator" class="calculator" autocomplete="off">
      <div class="form-grid">
        <div class="input-group">
          <label class="field">
            <span>THAC0</span>
            <input id="thaco-input" type="number" value="20" min="-20" step="1" />
          </label>

          <label class="field">
            <span>Armor Class</span>
            <input id="ac-input" type="number" value="10" min="-20" step="1" />
          </label>

          <label class="field">
            <span>Attack Bonus</span>
            <input id="bonus-input" type="number" value="0" min="-20" step="1" />
          </label>
        </div>

        <div class="action-group">
          <div class="results">
            <div class="result-row">
              <span>Needed roll</span>
              <strong id="needed-value">-</strong>
            </div>
          </div>

          <div class="actions">
            <button id="roll-btn" type="button">Roll d20</button>
          </div>
        </div>
      </div>

      <section id="roll-output" class="roll-output empty">
        <div class="roll-card">
          <div class="roll-label">d20 roll</div>
          <div id="roll-value" class="roll-value">-</div>
          <div id="roll-result" class="roll-result">-</div>
        </div>
      </section>
    </form>
  </main>
`

const thacoInput = document.getElementById('thaco-input')
const acInput = document.getElementById('ac-input')
const bonusInput = document.getElementById('bonus-input')
const rollBtn = document.getElementById('roll-btn')
const neededValue = document.getElementById('needed-value')
const rollOutput = document.getElementById('roll-output')
const rollValue = document.getElementById('roll-value')
const rollResult = document.getElementById('roll-result')

function updateResults() {
  const thaco = Number(thacoInput.value)
  const ac = Number(acInput.value)
  const bonus = Number(bonusInput.value)
  const needed = clamp(calculateThreshold(thaco, ac, bonus), 1, 20)

  neededValue.textContent = `${needed}`
}

function rollD20() {
  const thaco = Number(thacoInput.value)
  const ac = Number(acInput.value)
  const bonus = Number(bonusInput.value)
  const threshold = calculateThreshold(thaco, ac, bonus)
  const needed = clamp(threshold, 1, 20)
  const roll = Math.floor(Math.random() * 20) + 1
  const hit = isHit(roll, needed)

  rollValue.textContent = roll.toString()
  rollResult.textContent = hit ? 'Hit' : 'Miss'
  rollResult.classList.toggle('hit', hit)
  rollResult.classList.toggle('miss', !hit)
  rollOutput.classList.remove('empty')

  OBR.notification.show(`Rolled ${roll}: ${hit ? 'HIT' : 'MISS'}`)
}

thacoInput.addEventListener('input', updateResults)
acInput.addEventListener('input', updateResults)
bonusInput.addEventListener('input', updateResults)
rollBtn.addEventListener('click', rollD20)

updateResults()
