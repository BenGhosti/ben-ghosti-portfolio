/* ═══════════════════════════════════════════════════════════
   MAIN.JS — Quiz Logic für Quadratische Gleichungen (Klasse 10)
   PQ-Formel & Quadratische Ergänzung
═══════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────
// QUIZ DATA
// ─────────────────────────────────────────────────────────

const quizData = [
  { id: 1, question: "Welche Form benötigen wir, um die PQ-Formel anzuwenden?", type: "multiple-choice", options: ["ax² + bx + c = 0 (mit a ≠ 1)", "x² + px + q = 0 (Normalform, a = 1)", "ax² + c = 0", "(x + p)² = q"], correct: 1, explanation: "Die PQ-Formel funktioniert nur in der Normalform x² + px + q = 0." },
  { id: 2, question: "Wie lautet die PQ-Formel?", type: "multiple-choice", options: ["x = −p ± √(p² − 4q)", "x = −p/2 ± √((p/2)² − q)", "x = p ± √(p² + q)", "x = √(p² − q)"], correct: 1, explanation: "Die PQ-Formel lautet: x = −p/2 ± √((p/2)² − q)." },
  { id: 3, question: "Was ist der Diskriminant D in der PQ-Formel?", type: "multiple-choice", options: ["D = p − q", "D = (p/2)² − q", "D = p² − q", "D = p + q"], correct: 1, explanation: "Der Diskriminant D = (p/2)² − q bestimmt die Anzahl der Lösungen." },
  { id: 4, question: "Wende die PQ-Formel auf x² + 4x + 3 = 0 an. Welche Lösungen erhältst du?", type: "text-input", userAnswer: "", correct: ["-1, -3"], explanation: "Mit p = 4, q = 3 ergeben sich die Lösungen x₁ = -1 und x₂ = -3." },
  { id: 5, question: "Was ist der erste Schritt der Quadratischen Ergänzung?", type: "multiple-choice", options: ["Die Gleichung durch a dividieren", "Alle Terme nach links bringen", "Die Konstante auf die rechte Seite bringen", "Ein binomisches Quadrat bilden"], correct: 2, explanation: "Zuerst bringen wir die Konstante q auf die rechte Seite: x² + px = −q." },
  { id: 6, question: "Wie funktioniert die Quadratische Ergänzung? Berechne (p/2)² für p = 6.", type: "text-input", userAnswer: "", correct: ["9"], explanation: "(p/2)² = (6/2)² = 3² = 9." },
  { id: 7, question: "Löse x² + 6x + 5 = 0 mittels Quadratischer Ergänzung. Welche Lösungen erhältst du?", type: "text-input", userAnswer: "", correct: ["-1, -5"], explanation: "Nach Umstellung und Ergänzung erhält man x₁ = -1 oder x₂ = -5." },
  { id: 8, question: "Wann hat die Gleichung x² + px + q = 0 genau eine Lösung?", type: "multiple-choice", options: ["Wenn D > 0", "Wenn D = 0", "Wenn D < 0", "Wenn p = 0"], correct: 1, explanation: "Genau eine Lösung liegt vor, wenn D = 0 ist." },
  { id: 9, question: "Stelle 2x² + 8x + 6 = 0 in Normalform um.", type: "multiple-choice", options: ["x² + 4x + 3 = 0", "x² + 4x + 6 = 0", "2x² + 4x + 3 = 0", "x² + 8x + 6 = 0"], correct: 0, explanation: "Durch Division durch 2 erhält man x² + 4x + 3 = 0." },
  { id: 10, question: "Für x² − 6x + 9 = 0: Erkenne das binomische Quadrat und gib die Lösung an.", type: "text-input", userAnswer: "", correct: ["3"], explanation: "Es gilt (x − 3)² = 0, also ist x = 3 die einzige Lösung." }
];




// ─────────────────────────────────────────────────────────
// QUIZ STATE
// ─────────────────────────────────────────────────────────

let quizState = {
  currentQuestion: 0,
  score: 0,
  answers: [],        // MC: index gewählt | text: true/false
  isFinished: false,
  startTime: null,
  endTime: null,
  totalTime: 0
};

// DOM refs — werden in DOMContentLoaded gesetzt
let quizMeta, quizInner, quizPips;

// ─────────────────────────────────────────────────────────
// INITIALIZE QUIZ
// ─────────────────────────────────────────────────────────

function initQuiz() {
  // State zurücksetzen
  quizState = {
    currentQuestion: 0,
    score: 0,
    answers: [],
    isFinished: false,
    startTime: Date.now(),
    endTime: null,
    totalTime: 0
  };
  // Auch userAnswer in quizData leeren (für Text-Fragen)
  quizData.forEach(q => { if (q.type === 'text-input') q.userAnswer = ''; });

  renderQuizMeta();
  renderQuizPips();
  renderQuestion();
}

// ─────────────────────────────────────────────────────────
// RENDER META — Fortschrittsbalken
// ─────────────────────────────────────────────────────────

function renderQuizMeta() {
  const current    = quizState.currentQuestion + 1;
  const total      = quizData.length;
  const percentage = Math.round((current / total) * 100);

  quizMeta.innerHTML = `
    <span>Frage <strong>${current}</strong> / ${total}</span>
    <div class="quiz-progress">
      <div class="quiz-progress-bar" style="width:${percentage}%;"></div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────
// RENDER PIPS — Navigationspunkte
// ─────────────────────────────────────────────────────────

function renderQuizPips() {
  quizPips.innerHTML = '';

  quizData.forEach((_, idx) => {
    const pip = document.createElement('div');
    pip.className = 'pip';

    if (idx === quizState.currentQuestion) {
      pip.classList.add('active');
    } else if (idx < quizState.currentQuestion) {
      pip.classList.add('done');
      pip.addEventListener('click', () => {
        quizState.currentQuestion = idx;
        renderQuizMeta();
        renderQuizPips();
        renderQuestion();
      });
    }

    quizPips.appendChild(pip);
  });
}

// ─────────────────────────────────────────────────────────
// RENDER QUESTION
// ─────────────────────────────────────────────────────────

function renderQuestion() {
  if (quizState.isFinished) {
    renderResults();
    return;
  }

  const question = quizData[quizState.currentQuestion];
  const answered  = quizState.answers[quizState.currentQuestion] !== undefined;
  const isLast    = quizState.currentQuestion === quizData.length - 1;
  const isFirst   = quizState.currentQuestion === 0;

  let html = `<div class="quiz-question"><div class="quiz-q-text">${question.question}</div>`;

  // ── Multiple Choice ──
  if (question.type === 'multiple-choice') {
    html += `<div class="quiz-options">`;
    question.options.forEach((option, idx) => {
      const userPicked = quizState.answers[quizState.currentQuestion] === idx;
      const isCorrect  = idx === question.correct;
      let cls = 'quiz-option';
      if (answered) {
        if (isCorrect)              cls += ' correct';
        else if (userPicked)        cls += ' wrong';
      } else if (userPicked) {
        cls += ' selected';
      }
      html += `<div class="${cls}" data-idx="${idx}">${option}</div>`;
    });
    html += `</div>`;
  }

  // ── Text Input ──
  if (question.type === 'text-input') {
    const savedVal = question.userAnswer || '';
    html += `
      <input
        type="text"
        class="quiz-input"
        id="text-input"
        placeholder="Deine Antwort eingeben …"
        value="${savedVal}"
        ${answered ? 'disabled' : ''}
      />
    `;
  }

  // ── Erklärung (nach Antwort sichtbar) ──
  if (question.explanation) {
    html += `
      <div class="quiz-explanation ${answered ? 'show' : ''}">
        <strong>Erklärung:</strong> ${question.explanation}
      </div>
    `;
  }

  // ── Buttons ──
  html += `
    <div class="quiz-buttons">
      <button class="quiz-btn" id="prev-btn" ${isFirst ? 'disabled' : ''}>← Zurück</button>
      <button class="quiz-btn primary" id="next-btn">
        ${isLast ? 'Auswerten ✓' : 'Weiter →'}
      </button>
    </div>
  </div>`;

  quizInner.innerHTML = html;

  // ── Event Listeners ──
  if (question.type === 'multiple-choice') {
    quizInner.querySelectorAll('.quiz-option').forEach(option => {
      option.addEventListener('click', () => {
        if (answered) return;
        handleMultipleChoice(parseInt(option.dataset.idx));
        renderQuestion();
      });
    });
  }

  if (question.type === 'text-input') {
    const input = quizInner.querySelector('#text-input');
    if (input) {
      input.addEventListener('input', () => { question.userAnswer = input.value; });
    }
  }

  quizInner.querySelector('#prev-btn').addEventListener('click', prevQuestion);
  quizInner.querySelector('#next-btn').addEventListener('click', nextQuestion);
}

// ─────────────────────────────────────────────────────────
// HANDLE MULTIPLE CHOICE
// ─────────────────────────────────────────────────────────

function handleMultipleChoice(optionIdx) {
  // Nur werten, wenn noch nicht beantwortet
  if (quizState.answers[quizState.currentQuestion] !== undefined) return;

  quizState.answers[quizState.currentQuestion] = optionIdx;
  if (optionIdx === quizData[quizState.currentQuestion].correct) {
    quizState.score++;
  }
}

// ─────────────────────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────────────────────

function prevQuestion() {
  if (quizState.currentQuestion > 0) {
    quizState.currentQuestion--;
    renderQuizMeta();
    renderQuizPips();
    renderQuestion();
  }
}

function nextQuestion() {
  const question = quizData[quizState.currentQuestion];

  // Text-Input validieren und werten
  if (question.type === 'text-input') {
    if (quizState.answers[quizState.currentQuestion] !== undefined) {
      // Bereits beantwortet — einfach weiter
    } else {
      const answer = (question.userAnswer || '').trim();
      if (!answer) {
        alert('Bitte gib eine Antwort ein!');
        return;
      }
      const correct = checkTextInput(question);
      quizState.answers[quizState.currentQuestion] = correct;
      if (correct) quizState.score++;
      renderQuestion(); // Erklärung zeigen
      return;           // Noch nicht weiterspringen — User sieht Feedback
    }
  }

  // Multiple Choice: Pflichtauswahl
  if (question.type === 'multiple-choice') {
    if (quizState.answers[quizState.currentQuestion] === undefined) {
      alert('Bitte wähle eine Antwort!');
      return;
    }
  }

  // Weiter oder beenden
  if (quizState.currentQuestion < quizData.length - 1) {
    quizState.currentQuestion++;
    renderQuizMeta();
    renderQuizPips();
    renderQuestion();
  } else {
    finishQuiz();
  }
}


// ─────────────────────────────────────────────────────────
// ROBUSTER TEXT INPUT CHECK (Maximale Toleranz)
// ─────────────────────────────────────────────────────────

function checkTextInput(question) {
  const extractNumbers = (str) => {
    if (!str) return [];
    // Ersetzt alles außer Ziffern, Minus und Punkt/Komma durch Leerzeichen
    // So werden "x1", "und", "=" etc. einfach ignoriert
    let cleanStr = String(str).toLowerCase()
      .replace(/[^0-9.,-]/g, ' ')
      .replace(/,/g, '.');
    
    // Findet alle Zahlen (inklusive negativer)
    const matches = cleanStr.match(/-?\d+(\.\d+)?/g);
    return matches ? matches.map(Number) : [];
  };

  const userNumbers = extractNumbers(question.userAnswer);
  if (userNumbers.length === 0) return false;

  return question.correct.some(correctOption => {
    const correctNumbers = extractNumbers(correctOption);
    // Prüft, ob alle Zahlen der Lösung in der Eingabe vorhanden sind (Toleranz 0.001)
    return correctNumbers.every(cNum => 
      userNumbers.some(uNum => Math.abs(uNum - cNum) < 0.001)
    );
  });
}

// ─────────────────────────────────────────────────────────
// FINISH QUIZ
// ─────────────────────────────────────────────────────────

function finishQuiz() {
  quizState.isFinished = true;
  quizState.endTime    = Date.now();
  quizState.totalTime  = Math.round((quizState.endTime - quizState.startTime) / 1000);
  renderResults();
  renderQuizMeta();
  renderQuizPips();
}

// ─────────────────────────────────────────────────────────
// RENDER RESULTS
// ─────────────────────────────────────────────────────────

function renderResults() {
  const total      = quizData.length;
  const percentage = Math.round((quizState.score / total) * 100);
  const minutes    = Math.floor(quizState.totalTime / 60);
  const seconds    = quizState.totalTime % 60;

  let feedback = '';
  let emoji    = '';
  if      (percentage === 100) { feedback = 'Perfekt! Alle Fragen korrekt!';                                           emoji = '🎉'; }
  else if (percentage >= 80)   { feedback = 'Ausgezeichnet! PQ-Formel und Quadratische Ergänzung sitzen super!';       emoji = '🌟'; }
  else if (percentage >= 60)   { feedback = 'Gut! Grundlagen verstanden — ein bisschen mehr Übung hilft!';             emoji = '👍'; }
  else if (percentage >= 40)   { feedback = 'Noch einige Punkte zum Wiederholen. Schau dir die Erklärungen nochmal an.'; emoji = '📚'; }
  else                         { feedback = 'Empfehlung: Lernmaterialien nochmal durcharbeiten und erneut versuchen!'; emoji = '💡'; }

  // Review-Liste
  let reviewHTML = '<div class="review">';
  quizData.forEach((q, idx) => {
    const answered  = quizState.answers[idx];
    const isCorrect = q.type === 'text-input' ? answered === true : answered === q.correct;
    const userText  = q.type === 'text-input'
      ? (q.userAnswer || '–')
      : (q.options[answered] || '–');
    const correctText = q.type === 'text-input' ? q.correct[0] : q.options[q.correct];

    reviewHTML += `
      <div class="review-item ${isCorrect ? 'r-ok' : 'r-no'}">
        <span class="ic">${isCorrect ? '✓' : '✗'}</span>
        <div>
          <strong>F${idx + 1}:</strong> ${userText}
          ${!isCorrect ? `<small>Richtig: ${correctText}</small>` : ''}
        </div>
      </div>
    `;
  });
  reviewHTML += '</div>';

  quizInner.innerHTML = `
    <div class="quiz-done">
      <div class="score-ring">
        <div class="ring-inner">
          <div class="val">${quizState.score}/${total}</div>
          <div class="pct">${percentage}%</div>
        </div>
      </div>

      <h3>${emoji} ${percentage >= 80 ? 'Glückwunsch!' : 'Ergebnis'}</h3>
      <p style="font-size:1rem; color:var(--k-ink-1); margin-bottom:1.25rem;">${feedback}</p>
      <p style="font-size:0.85rem; color:var(--k-ink-2); margin-bottom:1.5rem;">
        ⏱️ Zeit: ${minutes}:${seconds.toString().padStart(2, '0')} Min
      </p>

      <p style="font-size:0.85rem; font-weight:600; color:var(--k-ink-2); text-align:left; margin-bottom:0.5rem; letter-spacing:0.05em; text-transform:uppercase;">
        Deine Antworten
      </p>
      ${reviewHTML}

      <button class="quiz-btn primary" id="restart-btn" style="margin-top:1.5rem;">
        Quiz wiederholen
      </button>
    </div>
  `;

  quizInner.querySelector('#restart-btn').addEventListener('click', initQuiz);
}

// ─────────────────────────────────────────────────────────
// DOM READY — alles starten
// ─────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {

  // Jahr im Footer
  const yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ── Mobiles Nav-Menü ──
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks  = document.querySelector('.nav-links');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('open');
      navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('open');
        navLinks.classList.remove('open');
      });
    });
  }

  // ── Accordion ──
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const item       = header.parentElement;
      const isOpen     = item.classList.contains('active');
      // Alle schließen
      document.querySelectorAll('.accordion-item.active').forEach(open => {
        open.classList.remove('active');
      });
      // Angeklicktes öffnen (wenn es vorher zu war)
      if (!isOpen) item.classList.add('active');
    });
  });

  // ── Quiz initialisieren ──
  // DOM-Refs jetzt setzen (Elemente existieren im HTML)
  const quizContainer = document.getElementById('quiz-container');
  if (quizContainer) {
    quizMeta  = quizContainer.querySelector('.quiz-meta');
    quizInner = quizContainer.querySelector('.quiz-inner');
    quizPips  = quizContainer.querySelector('.quiz-pips');
    initQuiz();
  }

});

// ─────────────────────────────────────────────────────────
// SMOOTH SCROLL (für Links außerhalb des DOMContentLoaded)
// ─────────────────────────────────────────────────────────

document.addEventListener('click', e => {
  const anchor = e.target.closest('a[href^="#"]');
  if (!anchor) return;
  const target = document.querySelector(anchor.getAttribute('href'));
  if (target) {
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

// ─────────────────────────────────────────────────────────
// KEYBOARD SHORTCUTS
// ─────────────────────────────────────────────────────────

document.addEventListener('keydown', e => {
  if (quizState.isFinished) return;
  if (e.key === 'ArrowLeft')  document.querySelector('#prev-btn')?.click();
  if (e.key === 'ArrowRight') document.querySelector('#next-btn')?.click();
});
