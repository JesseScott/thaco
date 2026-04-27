import './style.css'
import OBR from '@owlbear-rodeo/sdk'
import { clamp, calculateThreshold, isHit } from './thaco.js'

const app = document.querySelector('#app')

app.innerHTML = `
  <main class="panel">
    <header class="hero-panel">
      <h1>THACO Calculator</h1>
      <p>Simplified AD&D 2E combat calculations</p>
    </header>

    <div class="section-divider"></div>

    <form id="calculator" class="calculator" autocomplete="off">
      <div class="form-grid">
        <div class="input-group">
          <label class="field">
            <span>THAC0</span>
            <input id="thaco-input" type="number" value="20" min="-20" step="1" />
          </label>

          <label class="field" id="ac-field">
            <span>Armor Class</span>
            <input id="ac-input" type="number" value="10" min="-20" step="1" />
          </label>

          <label class="field" id="manual-roll-field" style="display: none;">
            <span>d20 Roll</span>
            <input id="manual-roll-input" type="number" value="10" min="1" max="20" step="1" />
          </label>

          <label class="field">
            <span>Attack Bonus</span>
            <input id="bonus-input" type="number" value="0" min="-20" step="1" />
          </label>
        </div>

        <div class="action-group">
          <label class="mode-toggle">
            <input id="mode-toggle" type="checkbox" />
            <span>Calculate Hit AC</span>
          </label>

          <div class="results">
            <div class="result-row">
              <span id="result-label">Target</span>
              <strong id="result-value">-</strong>
            </div>
          </div>

          <div class="actions">
            <button id="roll-btn" type="button">Roll d20</button>
            <button id="reset-btn" type="button">Reset</button>
          </div>
        </div>
      </div>

      <section id="roll-output" class="roll-output empty">
        <div class="roll-card">
          <div class="roll-label">Recent Roll</div>
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
const resetBtn = document.getElementById('reset-btn')
const resultValue = document.getElementById('result-value')
const resultLabel = document.getElementById('result-label')
const rollOutput = document.getElementById('roll-output')
const rollValue = document.getElementById('roll-value')
const rollResult = document.getElementById('roll-result')
const modeToggle = document.getElementById('mode-toggle')
const manualRollInput = document.getElementById('manual-roll-input')
const acField = document.getElementById('ac-field')
const manualRollField = document.getElementById('manual-roll-field')

const STORAGE_KEY = 'thaco-calculator-state'

function saveState() {
  const state = {
    thaco: thacoInput.value,
    ac: acInput.value,
    bonus: bonusInput.value,
    manualRoll: manualRollInput.value,
    isHitAcMode: modeToggle.checked,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      const state = JSON.parse(saved)
      thacoInput.value = state.thaco
      acInput.value = state.ac
      bonusInput.value = state.bonus
      manualRollInput.value = state.manualRoll
      modeToggle.checked = state.isHitAcMode
    } catch (e) {
      console.error('Error loading state from localStorage', e)
    }
  }
}

function updateResults() {
  const thaco = Number(thacoInput.value)
  const bonus = Number(bonusInput.value)
  const isHitAcMode = modeToggle.checked

  if (isHitAcMode) {
    const roll = Number(manualRollInput.value)
    const ac = thaco - bonus - roll
    resultValue.textContent = `${ac}`
  } else {
    const ac = Number(acInput.value)
    const needed = clamp(calculateThreshold(thaco, ac, bonus), 1, 20)
    resultValue.textContent = `${needed}`
  }
  saveState()
}

function toggleMode() {
  const isHitAcMode = modeToggle.checked
  if (isHitAcMode) {
    acField.style.display = 'none'
    manualRollField.style.display = 'flex'
    resultLabel.textContent = 'Hits AC'
  } else {
    acField.style.display = 'flex'
    manualRollField.style.display = 'none'
    resultLabel.textContent = 'Target'
  }
  updateResults()
  saveState()
}

function rollD20() {
  const isHitAcMode = modeToggle.checked
  if (isHitAcMode) {
    const roll = Math.floor(Math.random() * 20) + 1
    manualRollInput.value = roll
    updateResults()
    rollValue.textContent = roll.toString()
    rollResult.textContent = 'Rolled'
    rollResult.classList.remove('hit', 'miss')
    rollOutput.classList.remove('empty')
    OBR.notification.show(`Rolled ${roll} for AC calculation`)
  } else {
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
}

function resetInputs() {
  thacoInput.value = '20'
  acInput.value = '10'
  bonusInput.value = '0'
  manualRollInput.value = '10'
  modeToggle.checked = false
  toggleMode()
  rollOutput.classList.add('empty')
  rollValue.textContent = '-'
  rollResult.textContent = '-'
  rollResult.classList.remove('hit', 'miss')
  saveState()
}

thacoInput.addEventListener('input', updateResults)
acInput.addEventListener('input', updateResults)
bonusInput.addEventListener('input', updateResults)
manualRollInput.addEventListener('input', updateResults)
modeToggle.addEventListener('change', toggleMode)
rollBtn.addEventListener('click', rollD20)
resetBtn.addEventListener('click', resetInputs)

loadState()
toggleMode()
