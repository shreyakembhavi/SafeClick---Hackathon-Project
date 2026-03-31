/**
 * Replace raw technical LLM/Ollama errors with user-facing copy.
 */
export function polishReportText(report, prediction) {
  if (report == null || typeof report !== 'string') {
    return fallbackCopy(prediction);
  }

  const t = report.trim();
  const lower = t.toLowerCase();

  if (
    lower.includes('llm response unavailable') ||
    lower.includes('httppool') ||
    lower.includes('httpconnectionpool') ||
    lower.includes('connection refused') ||
    lower.includes('actively refused') ||
    lower.includes('max retries exceeded') ||
    lower.includes('failed to establish') ||
    lower.includes('newconnectionerror') ||
    lower.includes('name or service not known')
  ) {
    return fallbackCopy(prediction);
  }

  if (t.length < 3) {
    return fallbackCopy(prediction);
  }

  return t;
}

function fallbackCopy(prediction) {
  const p = (prediction || '').toLowerCase();
  if (p === 'malicious' || p === 'phishing') {
    return (
      'We could not load a full AI narrative right now, but your automated scan flagged elevated risk. ' +
      'Do not enter credentials or download files from this link until you trust the source.'
    );
  }
  if (p === 'suspicious') {
    return (
      'We could not load a full AI narrative right now. Your scan still surfaced caution signals—' +
      'verify the sender and domain before clicking or signing in.'
    );
  }
  if (p === 'safe' || p === 'legitimate') {
    return (
      'We could not load a full AI narrative right now, but your scan did not show major red flags. ' +
      'Still verify the sender before sharing sensitive information.'
    );
  }
  return (
    'We could not load a full AI narrative right now, but your scan completed using our safety models. ' +
    'Use the verdict and confidence above to guide your decision.'
  );
}

export function recommendationForVerdict(verdictKey) {
  switch (verdictKey) {
    case 'safe':
      return { title: 'Proceed', body: 'Signals look consistent with a normal site. Still use good judgment.' };
    case 'suspicious':
      return {
        title: 'Proceed with caution',
        body: 'Double-check the sender and URL. Avoid entering passwords or payment details.',
      };
    case 'malicious':
      return {
        title: 'Do not click',
        body: 'Avoid this link. Do not download files or enter sensitive information.',
      };
    default:
      return {
        title: 'Proceed with caution',
        body: 'We could not classify this cleanly. Verify manually before taking action.',
      };
  }
}

export function verdictFromPrediction(prediction) {
  const p = (prediction || '').toLowerCase();
  if (p === 'legitimate' || p === 'safe') return { key: 'safe', label: 'Safe' };
  if (p === 'suspicious') return { key: 'suspicious', label: 'Suspicious' };
  if (p === 'malicious' || p === 'phishing') return { key: 'malicious', label: 'Malicious' };
  return { key: 'inconclusive', label: 'Inconclusive' };
}
