import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import './App.css';

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'per month',
    available: true,
    blurb: 'Try SafeClick AI with daily free scans—perfect for individuals getting started.',
    features: ['3 URL or image scans per day', 'Plain-language report & verdict', 'Privacy-minded processing'],
    cta: 'Start on home',
    ctaHref: '/',
    ctaVariant: 'primary',
  },
  {
    name: 'Pro',
    price: '—',
    period: '',
    comingSoon: true,
    blurb: 'More scans, priority analysis, and personal workflows for power users.',
    features: ['Higher scan limits', 'Browser extension (planned)', 'Email digests (planned)'],
    cta: 'Join waitlist',
    ctaHref: 'mailto:contact@safeclick.ai?subject=SafeClick%20AI%20Pro%20waitlist',
    ctaVariant: 'waitlist',
  },
  {
    name: 'Business',
    price: '—',
    period: '',
    comingSoon: true,
    blurb: 'Team dashboard, shared policies, and expanded coverage for orgs without a full SOC.',
    features: ['Team seats & admin (planned)', 'Usage reporting (planned)', 'SSO & audit (roadmap)'],
    cta: 'Join waitlist',
    ctaHref: 'mailto:contact@safeclick.ai?subject=SafeClick%20AI%20Business%20waitlist',
    ctaVariant: 'waitlist',
  },
];

function Pricing() {
  return (
    <div className="page-shell">
      <Navbar />
      <main className="page-main pricing-page">
        <p className="page-kicker">Pricing</p>
        <h1 className="page-title">Simple plans. Honest limits.</h1>
        <p className="page-lead pricing-page__lead">
          Start free today. Pro and Business add higher limits, team tools, and integrations—we&apos;re
          shipping them next.
        </p>

        <div className="pricing-grid">
          {tiers.map((tier) => (
            <article
              key={tier.name}
              className={`pricing-tier${tier.available ? ' pricing-tier--highlight' : ''}`}
            >
              <div className="pricing-tier__head">
                <h2 className="pricing-tier__name">{tier.name}</h2>
                {tier.comingSoon && (
                  <span className="badge badge--soon">Coming soon</span>
                )}
              </div>
              <p className="pricing-tier__price">
                <span className="pricing-tier__amount">{tier.price}</span>
                {tier.period && <span className="pricing-tier__period"> {tier.period}</span>}
              </p>
              <p className="pricing-tier__blurb">{tier.blurb}</p>
              <ul className="pricing-tier__list">
                {tier.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              {tier.available ? (
                <Link to={tier.ctaHref} className="btn btn--primary btn--block">
                  {tier.cta}
                </Link>
              ) : (
                <a
                  href={tier.ctaHref}
                  className="btn btn--secondary btn--block"
                >
                  {tier.cta}
                </a>
              )}
            </article>
          ))}
        </div>

        <p className="pricing-note">
          Advanced features—including a browser extension, team dashboard, SSO, and expanded scan
          capabilities—are on the roadmap. We&apos;ll share timelines with waitlist subscribers first.
        </p>

        <Link to="/" className="btn btn--ghost pricing-back">
          ← Back to home
        </Link>
      </main>
      <Footer />
    </div>
  );
}

export default Pricing;
