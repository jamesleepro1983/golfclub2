import { Zap } from 'lucide-react';
import { parseCurrency, formatCurrency } from '../data/golfData';

// Circular icon component mimicking the progress chart
const CircularProgressIcon = ({ percentage = 75 }) => {
  const r = 9;
  const c = 2 * Math.PI * r; // ~56.55
  const offset = c - (percentage / 100) * c;
  
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#126D5B]">
      {/* Background circle */}
      <circle cx="12" cy="12" r={r} stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
      {/* Progress arc */}
      <circle 
        cx="12" 
        cy="12" 
        r={r} 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeDasharray={c} 
        strokeDashoffset={offset} 
        strokeLinecap="round" 
        transform="rotate(-90 12 12)" 
      />
    </svg>
  );
};

const OpportunityCards = ({ data, onEmailClick }) => {
  if (!data || data.length === 0) {
    return null;
  }

  // Rank by potential_revenue DESC
  const sorted = [...data].sort((a, b) => 
    parseCurrency(b.potential_revenue) - parseCurrency(a.potential_revenue)
  );

  const top3 = sorted.slice(0, 3);

  const timeRanges = {
    'Morning': '07:00-09:59',
    'Late AM': '10:00-11:59',
    'Early PM': '12:00-13:59',
    'Late PM': '14:00-16:59',
  };

  const formatDayTime = (item) => {
    const band = item.time_band || '';
    return (
      <>
        {item.day || ''}, {band}
        {timeRanges[band] && (
          <span className="text-sm font-normal text-gray-400 ml-1">
            ({timeRanges[band]})
          </span>
        )}
      </>
    );
  };

  // Get suggested action based on available slots
  const getSuggestedAction = (slots, timeBand, day) => {
    const period = timeBand ? timeBand.toLowerCase() : 'this period';
    if (slots > 80) {
      return `Promote ${day} ${period} visitor tee times via email and social media`;
    }
    if (slots >= 30) {
      return `Target ${period} slots with special offers for quieter periods`;
    }
    return `Consider small discount for ${period} times after peak hours`;
  };

  // Mock percentages for the progress rings to match UI visual
  const mockPercentages = [90, 85, 90];

  return (
    <section className="mb-8 bg-white border border-[#E5E7EB] rounded-xl shadow-sm p-6 overflow-hidden">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#1A1A1A]">
          Top Revenue Opportunities
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {top3.map((item, index) => {
          const revenue = parseCurrency(item.potential_revenue);

          return (
            <div 
              key={index} 
              className="bg-white rounded-lg border border-[#E5E7EB] flex flex-col justify-between overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow"
              style={{ borderLeft: '5px solid #126D5B' }}
            >
              <div className="p-5 pb-4 flex-1">
                {/* Title */}
                <h3 className="text-[15px] font-bold text-[#1A1A1A] mb-4 h-11 line-clamp-2 leading-snug">
                  {formatDayTime(item)}
                </h3>

                {/* Revenue Huge Text */}
                <div className="mb-1">
                  <p className="text-4xl font-extrabold text-[#1A1A1A] tracking-tight">
                    {formatCurrency(revenue)}
                  </p>
                </div>
                
                {/* Revenue Potential Date Subtext */}
                <p className="text-sm font-medium text-[#4B5563] mb-6">
                  Revenue Potential {item.play_date ? `for ${item.play_date}` : ''}
                </p>

                {/* Slots info with Circular Icon */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <CircularProgressIcon percentage={mockPercentages[index]} />
                    <span className="text-sm font-bold text-[#1A1A1A]">
                      {item.available_slots} Slots
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-[#6B7280]">
                    {mockPercentages[index]}%
                  </span>
                </div>
              </div>

              {/* Bottom Actions section */}
              <div className="px-5 pb-5">
                <hr className="border-t border-[#E5E7EB] mb-4" />
                
                {/* Pill Buttons */}
                <div className="flex justify-between gap-2 mb-4">
                  {['Email', 'Social', 'Pricing'].map((label) => {
                    const isEmail = label === 'Email';
                    return (
                      <button
                        key={label}
                        onClick={isEmail ? () => onEmailClick && onEmailClick(item) : undefined}
                        className="flex-1 rounded-full py-1.5 text-[13px] font-semibold transition-colors text-[#4B5563] bg-[#F3F4F6] hover:bg-[#126D5B] hover:text-white"
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Launch Campaign Button */}
                <button className="w-full rounded-md py-2.5 text-sm font-semibold text-white bg-[#126D5B] hover:bg-[#0e594a] transition-colors mb-4">
                  Launch Campaign
                </button>

                {/* Suggested Action */}
                <div className="bg-gradient-to-br from-[#F0FAF8] to-[#E6FFF5] rounded-xl p-4 border border-[#D1FAE5]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#013734] flex items-center justify-center flex-shrink-0">
                      <Zap className="w-4 h-4 text-[#40FFB9]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#013734] uppercase tracking-wider mb-1">
                        Suggested Action
                      </p>
                      <p className="text-sm text-[#013734] leading-relaxed">
                        {getSuggestedAction(item.available_slots, item.time_band, item.day)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default OpportunityCards;