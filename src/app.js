import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScanLimitBanner from './components/ScanLimitBanner';
import Pricing from './Pricing';
import ThreatReport from './ThreatReport';
import Terms from './Terms';
import HowItWorks from './pages/HowItWorks';
import Privacy from './pages/Privacy';
import { getScanStatus, consumeScan } from './utils/scanLimit';
import './App.css';

const API_BASE = 'http://127.0.0.1:5000';

function HomePage() {
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [limitMessage, setLimitMessage] = useState(null);
  const navigate = useNavigate();

  const normalizeUrl = (inputUrl) => {
    if (!/^https?:\/\//i.test(inputUrl)) {
      return `http://${inputUrl}`;
    }
    return inputUrl;
  };

  const handleCheck = async (e) => {
    e.preventDefault();
    setLimitMessage(null);

    const trimmedUrl = url.trim();
    const hasUrl = trimmedUrl !== '';
    const hasFile = file !== null;

    if (!hasUrl && !hasFile) {
      setLimitMessage('Enter a URL or upload a screenshot to scan.');
      return;
    }

    const status = getScanStatus();
    if (!status.canScan) {
      setLimitMessage(
        "You've reached today's free scan limit. Pro and Business plans are coming soon."
      );
      return;
    }

    setLoading(true);
    let result = null;

    try {
      if (hasUrl) {
        const normalized = normalizeUrl(trimmedUrl);
        const response = await fetch(`${API_BASE}/api/check_url`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ url: normalized }).toString(),
        });

        const text = await response.text();
        try {
          result = JSON.parse(text);
        } catch (err) {
          console.error('Failed to parse JSON:', err);
          setLimitMessage('The server returned an unexpected response. Please try again.');
          return;
        }

        if (result.error) {
          setLimitMessage(`Something went wrong: ${result.error}`);
          return;
        }

        if (!consumeScan()) {
          setLimitMessage(
            "You've reached today's free scan limit. Pro and Business plans are coming soon."
          );
          return;
        }

        navigate('/threat-report', {
          state: {
            confidence: result.confidence || 'N/A',
            prediction: result.prediction,
            report: result.llm_report || result.prediction || result.message || 'No report generated.',
            raw: result,
            url: result.url || normalized,
            source: 'Manual URL',
          },
        });
      } else if (hasFile) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE}/api/upload_image`, {
          method: 'POST',
          body: formData,
        });

        const text = await response.text();
        try {
          result = JSON.parse(text);
        } catch (err) {
          console.error('Failed to parse JSON:', err);
          setLimitMessage('The server returned an unexpected response. Please try again.');
          return;
        }

        if (result.error) {
          setLimitMessage(`Something went wrong: ${result.error}`);
          return;
        }

        if (
          result.message === 'No URL found in image.' &&
          (!result.urls || result.urls.length === 0)
        ) {
          setLimitMessage(
            'No link was found in that image. Try a clearer screenshot or paste the URL manually.'
          );
          return;
        }

        if (!consumeScan()) {
          setLimitMessage(
            "You've reached today's free scan limit. Pro and Business plans are coming soon."
          );
          return;
        }

        navigate('/threat-report', {
          state: {
            confidence: result.confidence || 'N/A',
            prediction: result.prediction,
            report: result.llm_report || result.message || 'No report generated.',
            raw: result,
            url: result.selected_url || 'Unknown',
            source: 'Image upload',
          },
        });
      }
    } catch (error) {
      console.error('Fetch failed:', error);
      setLimitMessage('We could not reach the scan service. Is the backend running?');
    } finally {
      setLoading(false);
      setUrl('');
      setFile(null);
    }
  };

  return (
    <div className="page-shell">
      <Navbar />
      <main className="home-main">
        <section className="hero">
          <p className="hero__eyebrow">SafeClick AI</p>
          <h1 className="hero__title">Clarity before every click.</h1>
          <p className="hero__subtitle">
            Scan suspicious links or upload screenshots for an instant threat assessment and
            plain-English explanation.
          </p>
        </section>

        <section className="scan-section" aria-labelledby="scan-heading">
          <div className="scan-card">
            <h2 id="scan-heading" className="scan-card__title">
              Check a link or image
            </h2>
            <ScanLimitBanner />
            {limitMessage && (
              <div className="form-alert" role="alert">
                {limitMessage}
              </div>
            )}
            <form onSubmit={handleCheck} className="scan-form">
              <label className="field-label" htmlFor="url-input">
                URL
              </label>
              <input
                id="url-input"
                className="input-field"
                type="text"
                placeholder="example.com or https://…"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                autoComplete="url"
                disabled={loading}
              />
              <label className="field-label" htmlFor="file-input">
                Or upload a screenshot
              </label>
              <div className="file-field">
                <input
                  id="file-input"
                  className="file-field__input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files[0] || null)}
                  disabled={loading}
                />
                <span className="file-field__hint">PNG, JPG, or JPEG — we read visible URLs from the image.</span>
              </div>
              <button className="btn btn--primary btn--block" type="submit" disabled={loading}>
                {loading ? 'Scanning…' : 'Run safety scan'}
              </button>
            </form>
            <p className="scan-card__footnote">
              Pro and Business tiers will add higher limits, team dashboards, and a browser extension—
              <span className="scan-card__soon"> coming soon.</span>
            </p>
          </div>
        </section>

        <section className="section section--story" aria-labelledby="story-heading">
          <h2 id="story-heading" className="section__title">
            How a scan works
          </h2>
          <div className="story-grid">
            <article className="story-card">
              <span className="story-card__step">1</span>
              <h3 className="story-card__title">Input</h3>
              <p className="story-card__text">Paste a URL or drop a screenshot with a link in frame.</p>
            </article>
            <article className="story-card">
              <span className="story-card__step">2</span>
              <h3 className="story-card__title">Analyze</h3>
              <p className="story-card__text">
                We evaluate signals and models to surface risk and confidence—not hype.
              </p>
            </article>
            <article className="story-card">
              <span className="story-card__step">3</span>
              <h3 className="story-card__title">Report</h3>
              <p className="story-card__text">
                Get a clear verdict, score, and plain-language guidance you can act on.
              </p>
            </article>
          </div>
        </section>

        <section className="section" aria-labelledby="value-heading">
          <h2 id="value-heading" className="section__title">
            Why teams use SafeClick AI
          </h2>
          <div className="value-grid">
            <article className="value-card">
              <h3 className="value-card__title">OCR screenshot scanning</h3>
              <p className="value-card__text">
                Snap a suspicious message and let us pull the URL from the image—no copy-paste required.
              </p>
            </article>
            <article className="value-card">
              <h3 className="value-card__title">Plain-English threat reports</h3>
              <p className="value-card__text">
                Understand what matters without digging through raw technical dumps.
              </p>
            </article>
            <article className="value-card">
              <h3 className="value-card__title">Confidence scoring</h3>
              <p className="value-card__text">
                See how strongly the assessment aligns so you can calibrate your own judgment.
              </p>
            </article>
            <article className="value-card">
              <h3 className="value-card__title">Privacy-first architecture</h3>
              <p className="value-card__text">
                Built for clarity: scan when you need it, without unnecessary data retention.
              </p>
            </article>
          </div>
        </section>

        <section className="section section--trust" aria-labelledby="trust-heading">
          <h2 id="trust-heading" className="section__title">
            Built for real-world use
          </h2>
          <p className="section__lead trust-lead">
            Everyday users, students, and small businesses without dedicated IT—anyone who wants a
            second opinion before they click.
          </p>
          <ul className="trust-pills">
            <li>Everyday browsing</li>
            <li>Students &amp; researchers</li>
            <li>Small teams &amp; solo operators</li>
          </ul>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/threat-report" element={<ThreatReport />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
      </Routes>
    </Router>
  );
}

export default App;
