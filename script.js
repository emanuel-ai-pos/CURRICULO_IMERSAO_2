// ===== Dados fictícios =====
const skills = [
  { name: 'Direito Civil', level: 95, label: 'Especialista', endorsements: 47 },
  { name: 'Direito Empresarial', level: 90, label: 'Especialista', endorsements: 38 },
  { name: 'Contratos', level: 92, label: 'Especialista', endorsements: 52 },
  { name: 'Mediação & Arbitragem', level: 85, label: 'Avançado', endorsements: 29 },
  { name: 'LGPD & Compliance', level: 78, label: 'Avançado', endorsements: 21 },
  { name: 'Negociação', level: 88, label: 'Avançado', endorsements: 34 },
];

const languages = [
  { name: 'Português', level: 100, color: '#0a66c2' },
  { name: 'Inglês', level: 85, color: '#0077b5' },
  { name: 'Espanhol', level: 60, color: '#70b5f9' },
];

const radarSkills = {
  labels: [
    'Direito Civil',
    'Empresarial',
    'Contratos',
    'Litígios',
    'Mediação',
    'Compliance',
  ],
  values: [95, 90, 92, 80, 85, 78],
};

const LINKEDIN_BLUE = '#0a66c2';

// ===== Skill pills (estilo LinkedIn) =====
function renderSkillPills() {
  const container = document.getElementById('skillPills');
  if (!container) return;

  container.innerHTML = skills
    .slice(0, 5)
    .map(
      (skill) => `
      <span class="skill-pill fade-in">
        ${skill.name}
        <span class="endorsements">${skill.endorsements} recomendações</span>
      </span>
    `
    )
    .join('');
}

// ===== Barras de habilidades =====
function renderSkillBars() {
  const container = document.getElementById('skillsBars');
  if (!container) return;

  container.innerHTML = skills
    .map(
      (skill) => `
      <div class="skill-item fade-in">
        <div class="skill-header">
          <span class="skill-name">${skill.name}</span>
          <span class="skill-level">${skill.label}</span>
        </div>
        <div class="skill-bar">
          <div class="skill-bar-fill" data-level="${skill.level}" style="--target-width: ${skill.level}%"></div>
        </div>
      </div>
    `
    )
    .join('');
}

function animateSkillBars() {
  const bars = document.querySelectorAll('.skill-bar-fill');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const bar = entry.target;
          const level = bar.dataset.level;
          requestAnimationFrame(() => {
            bar.style.width = `${level}%`;
          });
          observer.unobserve(bar);
        }
      });
    },
    { threshold: 0.3 }
  );

  bars.forEach((bar) => observer.observe(bar));
}

// ===== Gráfico de idiomas (Donut) =====
function renderLanguagesChart() {
  const canvas = document.getElementById('languagesChart');
  const legend = document.getElementById('languagesLegend');
  if (!canvas || !legend) return;

  legend.innerHTML = languages
    .map(
      (lang) => `
      <div class="legend-item">
        <span class="legend-dot" style="background: ${lang.color}"></span>
        <span>${lang.name} — ${lang.level}%</span>
      </div>
    `
    )
    .join('');

  new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: languages.map((l) => l.name),
      datasets: [
        {
          data: languages.map((l) => l.level),
          backgroundColor: languages.map((l) => l.color),
          borderWidth: 0,
          hoverOffset: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${ctx.raw}%`,
          },
        },
      },
      animation: {
        animateRotate: true,
        duration: 1200,
        easing: 'easeOutQuart',
      },
    },
  });
}

// ===== Gráfico Radar =====
function renderRadarChart() {
  const canvas = document.getElementById('skillsRadar');
  if (!canvas) return;

  new Chart(canvas, {
    type: 'radar',
    data: {
      labels: radarSkills.labels,
      datasets: [
        {
          label: 'Nível de competência',
          data: radarSkills.values,
          backgroundColor: 'rgba(10, 102, 194, 0.12)',
          borderColor: LINKEDIN_BLUE,
          borderWidth: 2,
          pointBackgroundColor: LINKEDIN_BLUE,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: { stepSize: 20, display: false },
          grid: { color: 'rgba(0, 0, 0, 0.06)' },
          angleLines: { color: 'rgba(0, 0, 0, 0.06)' },
          pointLabels: {
            font: { size: 11, family: 'Inter' },
            color: 'rgba(0, 0, 0, 0.6)',
          },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.raw}%`,
          },
        },
      },
      animation: {
        duration: 1200,
        easing: 'easeOutQuart',
      },
    },
  });
}

// ===== Fade-in ao scroll =====
function initScrollAnimations() {
  const elements = document.querySelectorAll(
    '.fade-in, .card, .timeline-item, .skill-pill'
  );

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
  );

  elements.forEach((el) => {
    el.classList.add('fade-in');
    observer.observe(el);
  });
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  renderSkillPills();
  renderSkillBars();
  animateSkillBars();
  renderLanguagesChart();
  renderRadarChart();
  initScrollAnimations();
});
