/**
 * Official LearnAfrica certification seal.
 * Kept as inline SVG so it remains sharp in the certificate preview,
 * downloaded PDF, print output and achievement badge.
 */
const RIM_POINTS = (() => {
  const teeth = 48;
  const points = [];
  for (let i = 0; i < teeth * 2; i += 1) {
    const angle = (i * Math.PI) / teeth - Math.PI / 2;
    const radius = i % 2 === 0 ? 94 : 87;
    points.push(`${(100 + radius * Math.cos(angle)).toFixed(2)},${(105 + radius * Math.sin(angle)).toFixed(2)}`);
  }
  return points.join(' ');
})();

const LEAVES = Array.from({ length: 9 }, (_, i) => {
  const angle = (-65 + i * 16.25) * Math.PI / 180;
  const x = 100 + 53 * Math.cos(angle);
  const y = 105 + 53 * Math.sin(angle);
  return [
    { x, y, rotation: -angle * 180 / Math.PI + 90 },
    { x: 200 - x, y, rotation: angle * 180 / Math.PI - 90 },
  ];
}).flat();

export function CertificateSeal({ size = 118, className = '' }) {
  return (
    <svg viewBox="0 0 200 240" width={size} height={size * 1.2} className={className}
      role="img" aria-label="LearnAfrica Certified Verified seal" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="la-ribbon" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#087d27" /><stop offset=".55" stopColor="#12a536" /><stop offset="1" stopColor="#075d20" />
        </linearGradient>
        <linearGradient id="la-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff0a0" /><stop offset=".35" stopColor="#e9b934" /><stop offset=".7" stopColor="#bd8514" /><stop offset="1" stopColor="#ffe47a" />
        </linearGradient>
        <radialGradient id="la-navy" cx=".42" cy=".3" r=".8">
          <stop offset="0" stopColor="#172f69" /><stop offset="1" stopColor="#06183f" />
        </radialGradient>
        <filter id="la-shadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#001b0b" floodOpacity=".38" />
        </filter>
        <path id="la-top-arc" d="M 28 105 A 72 72 0 0 1 172 105" />
        <path id="la-bottom-arc" d="M 29 111 A 71 71 0 0 0 171 111" />
      </defs>

      {/* Two green award ribbons with metallic-gold edging */}
      <g filter="url(#la-shadow)">
        <path d="M67 166 L67 232 L91 216 L100 225 L100 166 Z" fill="url(#la-ribbon)" stroke="url(#la-gold)" strokeWidth="1.7" />
        <path d="M100 166 L100 225 L109 216 L133 232 L133 166 Z" fill="url(#la-ribbon)" stroke="url(#la-gold)" strokeWidth="1.7" />
        <path d="M100 169 L100 225" stroke="#f4ca4e" strokeWidth="1.4" />
      </g>

      <g filter="url(#la-shadow)">
        <polygon points={RIM_POINTS} fill="url(#la-ribbon)" stroke="#d4a52b" strokeWidth="2" />
        <circle cx="100" cy="105" r="82" fill="#087c2a" stroke="url(#la-gold)" strokeWidth="2.5" />
        <circle cx="100" cy="105" r="76" fill="#fffefa" stroke="#0b244f" strokeWidth="1.5" />
        <circle cx="100" cy="105" r="59" fill="url(#la-navy)" stroke="url(#la-gold)" strokeWidth="3" />
        <circle cx="100" cy="105" r="54" fill="none" stroke="#d5a52c" strokeWidth=".8" strokeDasharray="1.2 3.4" />
        <text fontFamily="Georgia,serif" fontSize="12.5" fontWeight="700" letterSpacing="2.1" fill="#071a42">
          <textPath href="#la-top-arc" startOffset="50%" textAnchor="middle">LEARNAFRICA</textPath>
        </text>
        <text fontFamily="Georgia,serif" fontSize="10.5" fontWeight="700" letterSpacing="2.4" fill="#08752b">
          <textPath href="#la-bottom-arc" startOffset="50%" textAnchor="middle">CERTIFIED</textPath>
        </text>
        <g fill="url(#la-gold)" stroke="#9d6b0c" strokeWidth=".35">
          {LEAVES.map((leaf, i) => <ellipse key={i} cx={leaf.x} cy={leaf.y} rx="5.4" ry="2.4" transform={`rotate(${leaf.rotation} ${leaf.x} ${leaf.y})`} />)}
          <path d="M100 45 l2.4 6.2 6.5.3-5.1 4.1 1.8 6.3-5.6-3.6-5.6 3.6 1.8-6.3-5.1-4.1 6.5-.3z" />
          <path d="M27 103 l2 5 5 .2-4 3.2 1.4 5-4.4-2.9-4.4 2.9 1.4-5-4-3.2 5-.2z M173 103 l2 5 5 .2-4 3.2 1.4 5-4.4-2.9-4.4 2.9 1.4-5-4-3.2 5-.2z" />
        </g>
        <text x="100" y="119" textAnchor="middle" fontFamily="Georgia,serif" fontSize="31" fontWeight="700" fill="url(#la-gold)" stroke="#8e6413" strokeWidth=".45">LA</text>
        <path d="M73 128 H127" stroke="url(#la-gold)" strokeWidth="1.2" />
        <text x="100" y="140" textAnchor="middle" fontFamily="Georgia,serif" fontSize="7.5" letterSpacing="1.8" fill="#fff8dc">VERIFIED</text>
      </g>
    </svg>
  );
}

export default CertificateSeal;
