import { useState, useEffect, useRef } from 'react';
import { Mail, Wand2, Copy, Check, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

const PROMPT_TEMPLATE = `You are an expert golf club marketing copywriter specialising in visitor green fee campaigns for UK golf clubs.

Write a persuasive, conversion-focused visitor tee time email for the following club:

CLUB DETAILS
- Club name: {{club_name}}
- Location: {{club_location}}
- Phone number: {{club_phone}}
- Booking URL: {{club_booking_url}}
- Course designer: {{course_designer}}
- Year established: {{year_established}}
- Course description: {{course_description}}
- Key facilities: {{key_facilities}}
- Real customer quote: {{customer_quote}}

TEE TIME DATA
- Available time bands: {{time_bands}}
- Prices: {{prices}}
- Availability level: {{availability}}
- Specific quiet slot to promote: {{quiet_slot}}

TONE
{{tone}}

EMAIL REQUIREMENTS
Write a complete marketing email with the following structure:

1. SUBJECT LINE
- Specific and benefit-led
- Include either the price, the course designer, or a key selling point
- Under 60 characters
- No clickbait or vague teaser language

2. GREETING
- "Dear golfer," — keep it simple and universal

3. OPENING PARAGRAPH
- Warm, welcoming, one sentence
- Mention tee time availability and invite them to visit

4. COURSE DESCRIPTION PARAGRAPH
- 2-3 sentences describing the course in an appealing, specific way
- If a course designer is provided, name them and mention 1-2 other famous courses they designed
- End with the visitor experience promise (e.g. "treated as a member for the day")

5. CUSTOMER QUOTE (if provided)
- Include as a pull quote with attribution
- If no quote provided, skip this section entirely

6. AVAILABILITY SECTION
- List the time bands, prices, and availability in a clear, scannable way
- Do not use a table — write as simple line items

7. WHAT'S INCLUDED LIST
- 3-4 bullet points covering key facilities and the visitor experience
- Keep each point to one line

8. URGENCY LINE
- One sentence, honest scarcity
- No fake countdown timers or aggressive language
- Example: "Weekend slots are filling quickly — we recommend booking early to avoid disappointment."

9. CALL TO ACTION
- One primary CTA: "Book your tee time online" linking to {{club_booking_url}}
- One fallback: "Or call the pro shop: {{club_phone}}"
- Include the club address on the line below

10. SIGN OFF
- "We look forward to welcoming you."
- "The team at {{club_name}}"

WRITING RULES
- Tone should be warm, confident, and professional — never pushy or salesy
- Write as if the club manager is speaking directly to a golfer they genuinely want to welcome
- Use "you" and "your" throughout — speak to the reader directly
- Never use phrases like "Don't miss out", "Act now", "Limited time offer", or "Exciting news"
- Keep paragraphs short — maximum 3 sentences
- Total email body should be under 220 words (excluding subject line and sign off)
- UK English spelling throughout (e.g. "colour" not "color", "travelling" not "traveling")

OUTPUT FORMAT
Return a JSON object with NO markdown, NO backticks, NO extra text. Use exactly these keys:

{
  "subject": "email subject line here",
  "body": "full email body here with actual line breaks using \\n"
}`;

const CLUB_STORAGE_KEY = 'fiq_club_details';

const DEFAULT_CLUB = {
  name: '',
  location: '',
  phone: '',
  bookingUrl: '',
  courseDesigner: '',
  yearEstablished: '',
  courseDescription: '',
  keyFacilities: '',
  customerQuote: '',
};

const DEFAULT_CAMPAIGN = {
  quietSlot: '',
  availability: '',
  timeBands: '',
  prices: '',
};

const EmailGenerator = ({ prefill }) => {
  const [club, setClub] = useState(() => {
    try {
      const saved = localStorage.getItem(CLUB_STORAGE_KEY);
      return saved ? { ...DEFAULT_CLUB, ...JSON.parse(saved) } : DEFAULT_CLUB;
    } catch {
      return DEFAULT_CLUB;
    }
  });
  const [campaign, setCampaign] = useState(DEFAULT_CAMPAIGN);
  const [tone, setTone] = useState('Friendly');
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [clubOpen, setClubOpen] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(CLUB_STORAGE_KEY, JSON.stringify(club));
    } catch {}
  }, [club]);

  useEffect(() => {
    if (!prefill) return;
    setCampaign(prev => ({ ...prev, ...prefill }));
    setOutput(null);
    setError('');
    const clubFilled = Object.values(club).filter(v => v.trim()).length >= 3;
    if (!clubFilled) setClubOpen(true);
    setTimeout(() => sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }, [prefill]); // eslint-disable-line react-hooks/exhaustive-deps

  const buildPrompt = () =>
    PROMPT_TEMPLATE
      .replace(/\{\{club_name\}\}/g, club.name || 'the club')
      .replace(/\{\{club_location\}\}/g, club.location || 'not specified')
      .replace(/\{\{club_phone\}\}/g, club.phone || 'not specified')
      .replace(/\{\{club_booking_url\}\}/g, club.bookingUrl || 'not specified')
      .replace(/\{\{course_designer\}\}/g, club.courseDesigner || '')
      .replace(/\{\{year_established\}\}/g, club.yearEstablished || '')
      .replace(/\{\{course_description\}\}/g, club.courseDescription || '')
      .replace(/\{\{key_facilities\}\}/g, club.keyFacilities || '')
      .replace(/\{\{customer_quote\}\}/g, club.customerQuote || '')
      .replace(/\{\{time_bands\}\}/g, campaign.timeBands || '')
      .replace(/\{\{prices\}\}/g, campaign.prices || '')
      .replace(/\{\{availability\}\}/g, campaign.availability || '')
      .replace(/\{\{quiet_slot\}\}/g, campaign.quietSlot || '')
      .replace(/\{\{tone\}\}/g, tone);

  const generateEmail = async () => {
    const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;
    if (!apiKey) {
      setError('API key not configured. Add REACT_APP_ANTHROPIC_API_KEY to your .env file.');
      return;
    }

    setLoading(true);
    setError('');
    setOutput(null);

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
          max_tokens: 1500,
          messages: [{ role: 'user', content: buildPrompt() }],
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Request failed (${response.status})`);
      }

      const data = await response.json();
      const text = data.content[0].text.trim();
      const parsed = JSON.parse(text);
      setOutput({ subject: parsed.subject, body: parsed.body });
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Unexpected response format. Please try again.');
      } else {
        setError(err.message || 'An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyAll = async () => {
    if (!output) return;
    const text = `Subject: ${output.subject}\n\n${output.body}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clubFilled = Object.values(club).filter(v => v.trim()).length >= 3;
  const canGenerate = !!(campaign.quietSlot.trim() || campaign.timeBands.trim());

  const inputStyle = {
    border: '1px solid #E0E8E8',
    padding: '8px 12px',
    background: '#F8FAFA',
    outline: 'none',
    color: '#1A1A1A',
    fontFamily: 'inherit',
    fontSize: '13px',
  };

  const onFocus = e => { e.target.style.borderColor = '#40FFB9'; e.target.style.boxShadow = '0 0 0 3px rgba(64,255,185,0.12)'; e.target.style.background = '#fff'; };
  const onBlur  = e => { e.target.style.borderColor = '#E0E8E8'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F8FAFA'; };

  return (
    <div ref={sectionRef} className="card p-6 fade-in" style={{ animationDelay: '0.8s' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #013734, #126D5B)' }}>
          <Mail size={18} color="#40FFB9" />
        </div>
        <div>
          <h2 className="font-bold text-[#013734]" style={{ fontSize: '1.05rem' }}>
            AI Email Generator
          </h2>
          <p className="text-sm text-[#5C6B6B]">
            Click <strong>Email</strong> on any opportunity card, or fill in the details below
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Left: Form ── */}
        <div className="flex flex-col gap-5">

          {/* Club Details accordion */}
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E0E8E8' }}>
            <button
              onClick={() => setClubOpen(o => !o)}
              className="w-full flex items-center justify-between px-4 py-3 transition-colors"
              style={{ background: clubFilled ? '#F0FAF8' : '#FFFBEB' }}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#013734]">Club Details</span>
                {clubFilled
                  ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#D1FAE5', color: '#059669' }}>Saved</span>
                  : <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#FEF3C7', color: '#B45309' }}>Fill in once</span>
                }
              </div>
              {clubOpen ? <ChevronUp size={15} color="#5C6B6B" /> : <ChevronDown size={15} color="#5C6B6B" />}
            </button>

            {clubOpen && (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ borderTop: '1px solid #E0E8E8' }}>
                {[
                  { key: 'name',           label: 'Club Name',        placeholder: 'e.g. Canterbury Golf Club', req: true },
                  { key: 'location',       label: 'Location',          placeholder: 'e.g. Canterbury, Kent',    req: true },
                  { key: 'phone',          label: 'Phone Number',      placeholder: 'e.g. 01227 453532',        req: true },
                  { key: 'bookingUrl',     label: 'Booking URL',       placeholder: 'https://...',              req: true },
                  { key: 'courseDesigner', label: 'Course Designer',   placeholder: 'Optional'                         },
                  { key: 'yearEstablished',label: 'Year Established',  placeholder: 'Optional, e.g. 1927'              },
                  { key: 'keyFacilities',  label: 'Key Facilities',    placeholder: 'e.g. Driving range, Toptracer, Bar', wide: true },
                ].map(f => (
                  <div key={f.key} className={f.wide ? 'sm:col-span-2' : ''}>
                    <label className="block text-xs font-semibold text-[#013734] mb-1">
                      {f.label}{f.req && <span style={{ color: '#EF4444' }}> *</span>}
                    </label>
                    <input
                      type="text"
                      value={club[f.key]}
                      onChange={e => setClub(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full rounded-lg"
                      style={inputStyle}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                  </div>
                ))}

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#013734] mb-1">Course Description</label>
                  <textarea
                    value={club.courseDescription}
                    onChange={e => setClub(p => ({ ...p, courseDescription: e.target.value }))}
                    placeholder="e.g. Parkland course with tree-lined fairways and stunning views over the North Downs"
                    rows={2}
                    className="w-full rounded-lg resize-none"
                    style={inputStyle}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#013734] mb-1">
                    Customer Quote <span className="font-normal text-[#8A8A8A]">(optional)</span>
                  </label>
                  <textarea
                    value={club.customerQuote}
                    onChange={e => setClub(p => ({ ...p, customerQuote: e.target.value }))}
                    placeholder='"Best visitor experience I had - felt like a member all day." - John S.'
                    rows={2}
                    className="w-full rounded-lg resize-none"
                    style={inputStyle}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Campaign Details */}
          <div>
            <p className="text-sm font-semibold text-[#013734] mb-3">Campaign Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: 'quietSlot',   label: 'Quiet Slot to Promote',  placeholder: 'e.g. Monday afternoon' },
                { key: 'availability',label: 'Availability Level',      placeholder: 'e.g. Good weekday availability' },
                { key: 'timeBands',   label: 'Time Bands',              placeholder: 'e.g. Weekday, Weekend, Twilight' },
                { key: 'prices',      label: 'Prices',                  placeholder: 'e.g. Weekday £35, Weekend £45' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-[#013734] mb-1">{f.label}</label>
                  <input
                    type="text"
                    value={campaign[f.key]}
                    onChange={e => setCampaign(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full rounded-lg"
                    style={inputStyle}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div>
            <p className="text-xs font-semibold text-[#013734] mb-2">Tone</p>
            <div className="flex gap-2">
              {['Friendly', 'Urgent', 'Premium'].map(t => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: tone === t ? 'linear-gradient(135deg, #013734, #126D5B)' : '#F0FAF8',
                    color:      tone === t ? '#40FFB9' : '#126D5B',
                    border:    `1px solid ${tone === t ? 'transparent' : '#C6EAE0'}`,
                    cursor: 'pointer',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Generate */}
          <button
            onClick={generateEmail}
            disabled={!canGenerate || loading}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: !canGenerate || loading ? '#E0E8E8' : 'linear-gradient(135deg, #013734, #126D5B)',
              color:      !canGenerate || loading ? '#8A8A8A' : '#40FFB9',
              cursor:     !canGenerate || loading ? 'not-allowed' : 'pointer',
              border: 'none',
            }}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 animate-spin"
                  style={{ borderColor: '#40FFB9', borderTopColor: 'transparent' }} />
                Generating...
              </>
            ) : (
              <><Wand2 size={16} /> Generate Email</>
            )}
          </button>

          {error && (
            <div className="flex items-start gap-2.5 p-4 rounded-xl text-sm"
              style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* ── Right: Output ── */}
        <div className="flex flex-col gap-3">
          {/* Subject */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#013734]">Subject Line</label>
              {output && (
                <button
                  onClick={copyAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: copied ? '#ECFDF5' : '#F0FAF8',
                    color:      copied ? '#059669' : '#126D5B',
                    border:    `1px solid ${copied ? '#A7F3D0' : '#C6EAE0'}`,
                    cursor: 'pointer',
                  }}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied!' : 'Copy all'}
                </button>
              )}
            </div>
            <input
              type="text"
              value={output?.subject || ''}
              readOnly={!output}
              onChange={e => output && setOutput(p => ({ ...p, subject: e.target.value }))}
              placeholder="Subject line will appear here..."
              className="w-full rounded-xl"
              style={{
                ...inputStyle,
                padding: '10px 14px',
                fontWeight: output ? '600' : '400',
                background: output ? '#fff' : '#F8FAFA',
                border: '1px solid #E0E8E8',
              }}
              onFocus={e => output && (e.target.style.borderColor = '#40FFB9')}
              onBlur={e => (e.target.style.borderColor = '#E0E8E8')}
            />
          </div>

          {/* Body */}
          <div className="flex flex-col flex-1">
            <label className="text-xs font-semibold text-[#013734] mb-1.5">Email Body</label>
            {output ? (
              <textarea
                value={output.body}
                onChange={e => setOutput(p => ({ ...p, body: e.target.value }))}
                rows={17}
                className="w-full rounded-xl"
                style={{
                  ...inputStyle,
                  padding: '14px 16px',
                  background: '#fff',
                  lineHeight: '1.75',
                  resize: 'vertical',
                  border: '1px solid #E0E8E8',
                }}
                onFocus={e => (e.target.style.borderColor = '#40FFB9')}
                onBlur={e => (e.target.style.borderColor = '#E0E8E8')}
              />
            ) : (
              <div
                className="flex-1 rounded-xl flex flex-col items-center justify-center gap-3 p-6 text-center"
                style={{ border: '1px solid #E0E8E8', background: '#F8FAFA', minHeight: '300px' }}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: '#EBF5F3' }}>
                  <Mail size={22} color="#126D5B" />
                </div>
                <p className="text-sm text-[#5C6B6B]">Your generated email will appear here</p>
                <p className="text-xs text-[#8A8A8A]">
                  Fill in campaign details and click <strong>Generate Email</strong>
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
