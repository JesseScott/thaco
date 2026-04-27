import './style.css'
import OBR from '@owlbear-rodeo/sdk'
import { clamp, calculateThreshold, isHit, impliedThaco } from './thaco.js'

const app = document.querySelector('#app')

app.innerHTML = `
  <main class="panel">
    <header class="hero-panel">
      <h1>THACO Calculator</h1>
      <p>Enter your THAC0, target AC, and attack bonus to calculate.</p>
    </header>

    <div class="section-divider"></div>

    <form id="calculator" class="calculator" autocomplete="off">
      <div class="entry-management">
        <div class="field">
          <span>Entry</span>
          <div class="entry-controls">
            <select id="entry-select"></select>
            <button id="add-entry-btn" type="button" title="Add Entry">+</button>
            <button id="delete-entry-btn" type="button" title="Delete Entry" class="delete-btn">×</button>
          </div>
        </div>
        <label class="field">
          <span>Name</span>
          <input id="entry-name-input" type="text" placeholder="e.g. Longsword" />
        </label>
      </div>

      <div class="section-divider"></div>

      <label class="mode-toggle">
        <input id="mode-toggle" type="checkbox" />
        <span>Calculate hit AC instead</span>
      </label>

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
            <span>Roll</span>
            <input id="manual-roll-input" type="number" value="10" min="1" max="20" step="1" />
          </label>

          <label class="field">
            <span>Attack Bonus</span>
            <input id="bonus-input" type="number" value="0" min="-20" step="1" />
          </label>
        </div>

        <div class="action-group">
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
const entrySelect = document.getElementById('entry-select')
const entryNameInput = document.getElementById('entry-name-input')
const addEntryBtn = document.getElementById('add-entry-btn')
const deleteEntryBtn = document.getElementById('delete-entry-btn')

const STORAGE_KEY = 'thaco-calculator-state-v2'
const OLD_STORAGE_KEY = 'thaco-calculator-state'

let state = {
  entries: [
    {
      id: crypto.randomUUID(),
      name: 'Default',
      thaco: '20',
      ac: '10',
      bonus: '0',
    }
  ],
  currentEntryIndex: 0,
  manualRoll: '10',
  isHitAcMode: false,
}

function saveState() {
  // Update current entry with input values before saving
  const currentEntry = state.entries[state.currentEntryIndex]
  if (currentEntry) {
    currentEntry.thaco = thacoInput.value
    currentEntry.ac = acInput.value
    currentEntry.bonus = bonusInput.value
    currentEntry.name = entryNameInput.value || 'Unnamed'
  }
  state.manualRoll = manualRollInput.value
  state.isHitAcMode = modeToggle.checked

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      state = JSON.parse(saved)
    } catch (e) {
      console.error('Error loading state from localStorage', e)
    }
  } else {
    // Try to migrate from v1
    const oldSaved = localStorage.getItem(OLD_STORAGE_KEY)
    if (oldSaved) {
      try {
        const oldState = JSON.parse(oldSaved)
        state.entries[0].thaco = oldState.thaco
        state.entries[0].ac = oldState.ac
        state.entries[0].bonus = oldState.bonus
        state.manualRoll = oldState.manualRoll
        state.isHitAcMode = oldState.isHitAcMode
      } catch (e) {
        console.error('Error migrating old state', e)
      }
    }
  }
  renderEntrySelect()
  applyCurrentEntry()
}

function renderEntrySelect() {
  entrySelect.innerHTML = ''
  state.entries.forEach((entry, index) => {
    const option = document.createElement('option')
    option.value = index
    option.textContent = entry.name
    if (index === state.currentEntryIndex) {
      option.selected = true
    }
    entrySelect.appendChild(option)
  })
}

function applyCurrentEntry() {
  const entry = state.entries[state.currentEntryIndex]
  if (entry) {
    thacoInput.value = entry.thaco
    acInput.value = entry.ac
    bonusInput.value = entry.bonus
    entryNameInput.value = entry.name
    manualRollInput.value = state.manualRoll
    modeToggle.checked = state.isHitAcMode
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
    manualRollField.style.display = 'block'
    resultLabel.textContent = 'Hits AC'
    rollBtn.textContent = 'Roll d20'
  } else {
    acField.style.display = 'block'
    manualRollField.style.display = 'none'
    resultLabel.textContent = 'Target'
    rollBtn.textContent = 'Roll d20'
  }
  updateResults()
  saveState()
}

function rollD20() {
  const isHitAcMode = modeToggle.checked
  if (isHitAcMode) {
    // In hit AC mode, roll and set the manual roll input
    const roll = Math.floor(Math.random() * 20) + 1
    manualRollInput.value = roll
    updateResults()
    // Show in the roll output
    rollValue.textContent = roll.toString()
    rollResult.textContent = 'Rolled'
    rollResult.classList.remove('hit', 'miss')
    rollOutput.classList.remove('empty')
    OBR.notification.show(`Rolled ${roll} for AC calculation`)
  } else {
    // Normal mode
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

function addEntry() {
  saveState() // Save current entry before adding new one
  const newEntry = {
    id: crypto.randomUUID(),
    name: `Entry ${state.entries.length + 1}`,
    thaco: '20',
    ac: '10',
    bonus: '0',
  }
  state.entries.push(newEntry)
  state.currentEntryIndex = state.entries.length - 1
  renderEntrySelect()
  applyCurrentEntry()
  updateResults()
}

function deleteEntry() {
  if (state.entries.length <= 1) {
    OBR.notification.show('Cannot delete the last entry')
    return
  }
  state.entries.splice(state.currentEntryIndex, 1)
  state.currentEntryIndex = Math.max(0, state.currentEntryIndex - 1)
  renderEntrySelect()
  applyCurrentEntry()
  updateResults()
}

function switchEntry() {
  saveState()
  state.currentEntryIndex = parseInt(entrySelect.value)
  applyCurrentEntry()
  updateResults()
}

function updateEntryName() {
  const currentEntry = state.entries[state.currentEntryIndex]
  if (currentEntry) {
    currentEntry.name = entryNameInput.value
    // Update name in select dropdown
    const option = entrySelect.options[state.currentEntryIndex]
    if (option) {
      option.textContent = currentEntry.name || 'Unnamed'
    }
  }
  saveState()
}

thacoInput.addEventListener('input', updateResults)
acInput.addEventListener('input', updateResults)
bonusInput.addEventListener('input', updateResults)
manualRollInput.addEventListener('input', updateResults)
modeToggle.addEventListener('change', toggleMode)
rollBtn.addEventListener('click', rollD20)
resetBtn.addEventListener('click', resetInputs)

entrySelect.addEventListener('change', switchEntry)
addEntryBtn.addEventListener('click', addEntry)
deleteEntryBtn.addEventListener('click', deleteEntry)
entryNameInput.addEventListener('input', updateEntryName)

loadState()
toggleMode()
