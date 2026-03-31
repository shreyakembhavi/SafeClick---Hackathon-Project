import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import {
  polishReportText,
  recommendationForVerdict,
  verdictFromPrediction,
} from './utils/reportText';
import './App.css';

const FUN_FACTS = [
  'Billions of phishing attempts are sent every day—most are blocked, but the rest rely on one careless click.',
  'Many phishing sites stay online only for hours; speed of judgment matters.',
  'A large share of breaches start with a single deceptive link or attachment.',
  'Attackers often impersonate trusted brands—your pause before clicking is the best filter.',
];

const ThreatReport = () => {
  const location = useLocation();

  const {
    confidence = 'N/A',
    prediction: directPrediction,
    report = '',
    raw = {},
    url = 'Unknown',
    source = 'Unknown',
  } = location.state || {};

  const prediction = directPrediction || raw.prediction || '';
  const verdict = verdictFromPrediction(prediction);
  const polishedReport = polishReportText(report, prediction);
  const rec = recommendationForVerdict(verdict.key);
  const funFact = FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)];

  const verdictClass =
    verdict.key === 'safe'
      ? 'verdict-badge verdict-badge--safe'
      : verdict.key === 'suspicious'
        ? 'verdict-badge verdict-badge--suspicious'
        : verdict.key === 'malicious'
          ? 'verdict-badge verdict-badge--malicious'
          : 'verdict-badge verdict-badge--inconclusive';

  if (!location.state) {
    return (
      <div className="page-shell">
        <Navbar />
        <main className="page-main page-main--narrow report-empty">
          <h1 className="page-title">No scan data</h1>
          <p className="page-lead">Run a scan from the home page to see a report here.</p>
          <Link to="/" className="btn btn--primary">
            Back to home
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-shell">
      <Navbar />
      <main className="page-main report-page">
        <div className="report-page__toolbar">
          <Link to="/" className="btn btn--ghost btn--sm">
            ← New scan
          </Link>
        </div>

        <header className="report-header">
          <span className={verdictClass}>{verdict.label}</span>
          <h1 className="report-header__title">Threat assessment</h1>
          <p className="report-header__url" title={url}>
            {url}
          </p>
          <dl className="report-meta">
            <div>
              <dt>Source</dt>
              <dd>{source}</dd>
            </div>
            <div>
              <dt>Confidence</dt>
              <dd className="report-confidence">{confidence}</dd>
            </div>
          </dl>
        </header>

        <div className="report-grid">
          <section className="report-card report-card--analysis" aria-labelledby="analysis-title">
            <h2 id="analysis-title" className="report-card__title">
              Analysis
            </h2>
            <p className="report-card__body report-card__body--analysis">{polishedReport}</p>
          </section>

          <aside className="report-sidebar">
            <section className="report-card report-card--rec" aria-labelledby="rec-title">
              <h2 id="rec-title" className="report-card__title">
                Recommendation
              </h2>
              <p className="rec-title">{rec.title}</p>
              <p className="rec-body">{rec.body}</p>
            </section>

            <section className="report-card report-card--fact" aria-labelledby="fact-title">
              <h2 id="fact-title" className="report-card__title">
                Stay sharp
              </h2>
              <p className="fact-body">{funFact}</p>
            </section>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ThreatReport;
