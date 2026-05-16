import { useState, useEffect, useRef } from 'react';
import { Mail, Wand2, Copy, Check, AlertCircle } from 'lucide-react';

const SYSTEM_PROMPT = `You are writing promotional emails on behalf of Canterbury Golf Club.

Your job is to write short, human, conversational emails that feel like they were written by a real person at the club — not by AI or a marketing team.

Strict rules:
- Plain text only. No markdown, no asterisks, no dashes, no bullet points, no bold, no headers.
- No emojis whatsoever.
- No placeholder text like [Name], [Phone], [Link] — write around them naturally.
- Keep the total email under 180 words including subject line.
- Write in a warm, direct, conversational tone — like a message from the club manager.
- The subject line should be short (under 10 words), specific, and natural — not salesy.
- Start the body with "Hi there," or "Hi," — never "Dear Member" or formal greetings.
- One short paragraph max. No lists, no sections, no sign-off flourishes.
- End with: "Best, The Team at Canterbury Golf Club"
- The call to action should feel natural and low-pressure, not pushy.
- Focus on one specific benefit or reason to book — not a list of reasons.

Output format (plain text, nothing else):
Subject: [subject line]

[email body]`;

const EmailGenerator = ({ prefill }) => {
  const [prompt, setPrompt] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const sectionRef = useRef(null);

  // When an opportunity card triggers a prefill, populate the prompt and scroll here
  useEffect(() => {
    if (!prefill) return;
    setPrompt(prefill);
    setGeneratedEmail('');
    setError('');
    setTimeout(() => {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, [prefill]);

  const generateEmail = async () => {
    if (!prompt.trim()) return;

    const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;
    if (!apiKey) {
      setError('API key not configured. Add REACT_APP_ANTHROPIC_API_KEY to your .env file and restart the app.');
      return;
    }

    setLoading(true);
    setError('');
    setGeneratedEmail('');

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Request failed (${response.status})`);
      }

      const data = await response.json();
      setGeneratedEmail(data.content[0].text);
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedEmail);
    } catch {
      const el = document.createElement('textarea');
      el.value = generatedEmail;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      generateEmail();
    }
  };

  return (
    <div ref={sectionRef} className="card p-6 fade-in" style={{ animationDelay: '0.8s' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #013734, #126D5B)' }}
        >
          <Mail size={18} color="#40FFB9" />
        </div>
        <div>
          <h2 className="font-bold text-[#013734]" style={{ fontSize: '1.05rem' }}>
            AI Email Generator
          </h2>
          <p className="text-sm text-[#5C6B6B]">
            Click <strong>Email</strong> on any opportunity card above, or describe your own campaign below
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#013734] mb-2">
              Campaign Description
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Promote Tuesday morning tee times with a 15% early-bird discount to encourage bookings during our quietest period..."
              rows={6}
              className="w-full rounded-xl text-sm resize-none transition-all"
              style={{
                border: '1px solid #E0E8E8',
                padding: '12px 16px',
                color: '#1A1A1A',
                background: '#F8FAFA',
                outline: 'none',
                fontFamily: 'inherit',
                lineHeight: '1.6',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#40FFB9';
                e.target.style.boxShadow = '0 0 0 3px rgba(64, 255, 185, 0.15)';
                e.target.style.background = '#FFFFFF';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E0E8E8';
                e.target.style.boxShadow = 'none';
                e.target.style.background = '#F8FAFA';
              }}
            />
            <p className="mt-1.5 text-xs text-[#8A8A8A]">
              Tip: Press Ctrl+Enter to generate
            </p>
          </div>

          <button
            onClick={generateEmail}
            disabled={!prompt.trim() || loading}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all"
            style={{
              background:
                !prompt.trim() || loading
                  ? '#E0E8E8'
                  : 'linear-gradient(135deg, #013734, #126D5B)',
              color: !prompt.trim() || loading ? '#8A8A8A' : '#40FFB9',
              cursor: !prompt.trim() || loading ? 'not-allowed' : 'pointer',
              border: 'none',
              letterSpacing: '0.01em',
            }}
          >
            {loading ? (
              <>
                <div
                  className="w-4 h-4 rounded-full border-2 animate-spin"
                  style={{ borderColor: '#40FFB9', borderTopColor: 'transparent' }}
                />
                Generating email...
              </>
            ) : (
              <>
                <Wand2 size={16} />
                Generate Email
              </>
            )}
          </button>

          {error && (
            <div
              className="flex items-start gap-2.5 p-4 rounded-xl text-sm"
              style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}
            >
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Right: Output */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-[#013734]">
              Generated Email
            </label>
            {generatedEmail && (
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: copied ? '#ECFDF5' : '#F0FAF8',
                  color: copied ? '#059669' : '#126D5B',
                  border: `1px solid ${copied ? '#A7F3D0' : '#C6EAE0'}`,
                  cursor: 'pointer',
                }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            )}
          </div>

          <div
            className="flex-1 rounded-xl text-sm leading-relaxed"
            style={{
              border: '1px solid #E0E8E8',
              background: '#F8FAFA',
              minHeight: '220px',
              fontFamily: 'inherit',
            }}
          >
            {generatedEmail ? (
              <pre
                className="p-4 whitespace-pre-wrap text-[#1A1A1A] text-sm leading-relaxed"
                style={{ fontFamily: 'inherit', margin: 0 }}
              >
                {generatedEmail}
              </pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-3 p-6 text-center" style={{ minHeight: '220px' }}>
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: '#EBF5F3' }}
                >
                  <Mail size={22} color="#126D5B" />
                </div>
                <p className="text-sm text-[#5C6B6B]">Your generated email will appear here</p>
                <p className="text-xs text-[#8A8A8A]">
                  Click <strong>Email</strong> on a card above, or describe your campaign and click Generate
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailGenerator;
