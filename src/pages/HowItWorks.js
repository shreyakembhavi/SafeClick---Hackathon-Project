import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const steps = [
  {
    title: 'Input',
    body:
      'Paste a link or upload a screenshot. We normalize URLs and extract text from images when needed.',
  },
  {
    title: 'Analyze',
    body:
      'Our pipeline checks signals from the URL, page context, and models—without storing your submissions longer than needed for the scan.',
  },
  {
    title: 'Report',
    body:
      'You get a clear verdict, confidence context, and plain-language guidance so you can decide before you click.',
  },
];

export default function HowItWorks() {
  return (
    <div className="page-shell">
      <Navbar />
      <main className="page-main page-main--narrow">
        <p className="page-kicker">How it works</p>
        <h1 className="page-title">From link to clarity in seconds</h1>
        <p className="page-lead">
          SafeClick AI is built for quick, trustworthy assessments when something feels off—
          whether you&apos;re on email, social, or a suspicious text thread.
        </p>

        <ol className="steps-list">
          {steps.map((s, i) => (
            <li key={s.title} className="steps-list__item">
              <span className="steps-list__num" aria-hidden="true">
                {i + 1}
              </span>
              <div>
                <h2 className="steps-list__title">{s.title}</h2>
                <p className="steps-list__body">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="cta-block">
          <Link to="/" className="btn btn--primary">
            Try a free scan
          </Link>
          <Link to="/pricing" className="btn btn--ghost">
            View pricing
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
