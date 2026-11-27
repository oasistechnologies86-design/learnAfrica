import { useId } from 'react';

/**
 * Official LearnAfrica institutional seal.
 * Layered vector artwork keeps the metallic medallion crisp in previews,
 * certificates, print/PDF output and achievement badges.
 */
const TEETH = 48;
const ROSETTE_POINTS = Array.from({ length: TEETH * 2 }, (_, index) => {
  const angle = (index * Math.PI) / TEETH - Math.PI / 2;
  const radius = index % 2 === 0 ? 96 : 89;
  return `${(100 + radius * Math.cos(angle)).toFixed(2)},${(105 + radius * Math.sin(angle)).toFixed(2)}`;
}).join(' ');

const LAUREL_LEAVES = Array.from({ length: 11 }, (_, index) => {
  const angle = (-72 + index * 14.4) * Math.PI / 180;
  const x = 100 + 48 * Math.cos(angle);
  const y = 105 + 48 * Math.sin(angle);
  return [
    { x, y, rotation: -angle * 180 / Math.PI + 90 },
    { x: 200 - x, y, rotation: angle * 180 / Math.PI - 90 },
  ];
}).flat();

export function CertificateSeal({ size = 118, className = '' }) {
  const uid = useId().replace(/:/g, '');
  const id = (name) => `la-seal-${uid}-${name}`;

  return (
    <svg viewBox="0 0 200 240" width={size} height={size * 1.2}
      className={className} role="img"
      aria-label="LearnAfrica Certified Verified official seal"
      xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={id('green')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#49d45b" />
          <stop offset=".22" stopColor="#087c2b" />
          <stop offset=".52" stopColor="#16a13c" />
          <stop offset=".78" stopColor="#075b24" />
          <stop offset="1" stopColor="#39bd4e" />
        </linearGradient>
        <linearGradient id={id('gold')} x1="0" y1="0" x2=".9" y2="1">
          <stop offset="0" stopColor="#fff8c9" />
          <stop offset=".16" stopColor="#d99b19" />
          <stop offset=".34" stopColor="#fff0a0" />
          <stop offset=".53" stopColor="#a96c08" />
          <stop offset=".72" stopColor="#f6d45e" />
          <stop offset="1" stopColor="#8c5a08" />
        </linearGradient>
        <radialGradient id={id('ivory')} cx=".35" cy=".25" r=".85">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".7" stopColor="#fffdf2" />
          <stop offset="1" stopColor="#e8dfc4" />
        </radialGradient>
        <radialGradient id={id('navy')} cx=".35" cy=".22" r=".9">
          <stop offset="0" stopColor="#294b91" />
          <stop offset=".38" stopColor="#142e69" />
          <stop offset="1" stopColor="#06132f" />
        </radialGradient>
        <linearGradient id={id('ribbon')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#064b20" />
          <stop offset=".25" stopColor="#15983a" />
          <stop offset=".5" stopColor="#08702a" />
          <stop offset=".76" stopColor="#15983a" />
          <stop offset="1" stopColor="#043e1b" />
        </linearGradient>
        <filter id={id('emboss')} x="-25%" y="-20%" width="150%" height="155%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2.2" result="blur" />
          <feOffset in="blur" dx="0" dy="3" result="offset" />
          <feComponentTransfer in="offset" result="shadow">
            <feFuncA type="linear" slope=".42" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="shadow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={id('shine')} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
        <path id={id('top-arc')} d="M 27 105 A 73 73 0 0 1 173 105" />
        <path id={id('bottom-arc')} d="M 28 108 A 72 72 0 0 0 172 108" />
      </defs>

      {/* Award ribbons sit behind the medallion and have folded, gold-edged tails. */}
      <g filter={`url(#${id('emboss')})`}>
        <path d="M64 158 L64 233 L87 218 L100 229 L100 158 Z"
          fill={`url(#${id('ribbon')})`} stroke={`url(#${id('gold')})`} strokeWidth="2.2" />
        <path d="M100 158 L100 229 L113 218 L136 233 L136 158 Z"
          fill={`url(#${id('ribbon')})`} stroke={`url(#${id('gold')})`} strokeWidth="2.2" />
        <path d="M68 164 L68 224 L87 212" fill="none" stroke="#65d77a" strokeOpacity=".55" strokeWidth="1.2" />
        <path d="M132 164 L132 224 L113 212" fill="none" stroke="#65d77a" strokeOpacity=".45" strokeWidth="1.2" />
        <path d="M100 162 V225" stroke="#f7d66b" strokeWidth="1.6" />
      </g>

      <g filter={`url(#${id('emboss')})`}>
        {/* Deep scalloped green rosette with a raised double metallic rim. */}
        <polygon points={ROSETTE_POINTS} fill={`url(#${id('green')})`}
          stroke={`url(#${id('gold')})`} strokeWidth="3.2" />
        <polygon points={ROSETTE_POINTS} transform="translate(100 105) scale(.955) translate(-100 -105)"
          fill="none" stroke="#f8df82" strokeOpacity=".8" strokeWidth="1.2" />
        <circle cx="100" cy="105" r="83" fill={`url(#${id('green')})`}
          stroke={`url(#${id('gold')})`} strokeWidth="3.5" />
        <circle cx="100" cy="105" r="78.5" fill="none" stroke="#f5d66b" strokeWidth="1.1" />
        <circle cx="100" cy="105" r="75" fill={`url(#${id('ivory')})`}
          stroke="#092b20" strokeWidth="1.8" />
        <circle cx="100" cy="105" r="69.5" fill="none" stroke={`url(#${id('gold')})`} strokeWidth="1.7" />
        <circle cx="100" cy="105" r="63.5" fill="none" stroke="#d8b34c" strokeOpacity=".55" strokeWidth=".7" />

        {/* Raised navy enamel centre, framed by multiple gold bevel rings. */}
        <circle cx="100" cy="105" r="58.5" fill={`url(#${id('gold')})`} />
        <circle cx="100" cy="105" r="55.5" fill={`url(#${id('navy')})`}
          stroke="#fff0a0" strokeWidth="1.2" />
        <circle cx="100" cy="105" r="51.5" fill="none" stroke="#d7a83c"
          strokeWidth="1" strokeDasharray="1.4 2.7" />

        {/* Laurel wreath: individual gold leaves with a fine central stem. */}
        <g fill={`url(#${id('gold')})`} stroke="#95620d" strokeWidth=".45">
          {LAUREL_LEAVES.map((leaf, index) => (
            <ellipse key={index} cx={leaf.x} cy={leaf.y} rx="5.8" ry="2.65"
              transform={`rotate(${leaf.rotation} ${leaf.x} ${leaf.y})`} />
          ))}
        </g>
        <path d="M57 133 Q43 105 57 76 M143 133 Q157 105 143 76"
          fill="none" stroke={`url(#${id('gold')})`} strokeWidth="1.2" />

        {/* Curved institutional name and certification wording. */}
        <text fontFamily="Georgia,serif" fontSize="14.5" fontWeight="700"
          letterSpacing="1.1" fill="#071b3c">
          <textPath href={`#${id('top-arc')}`} startOffset="50%" textAnchor="middle"
            textLength="132" lengthAdjust="spacingAndGlyphs">LEARNAFRICA</textPath>
        </text>
        <text fontFamily="Georgia,serif" fontSize="12.5" fontWeight="700"
          letterSpacing="1.2" fill="#08712b">
          <textPath href={`#${id('bottom-arc')}`} startOffset="50%" textAnchor="middle"
            textLength="98" lengthAdjust="spacingAndGlyphs">CERTIFIED</textPath>
        </text>

        {/* Gold stars, central monogram and verified inscription. */}
        <g fill={`url(#${id('gold')})`} stroke="#94620c" strokeWidth=".45">
          <path d="M100 43 l2.8 7.1 7.5.3-5.8 4.8 2 7.2-6.5-4.1-6.5 4.1 2-7.2-5.8-4.8 7.5-.3z" />
          <path d="M25 101 l2.1 5.2 5.5.2-4.3 3.5 1.5 5.4-4.8-3.1-4.8 3.1 1.5-5.4-4.3-3.5 5.5-.2z" />
          <path d="M175 101 l2.1 5.2 5.5.2-4.3 3.5 1.5 5.4-4.8-3.1-4.8 3.1 1.5-5.4-4.3-3.5 5.5-.2z" />
        </g>
        <text x="100" y="119" textAnchor="middle" fontFamily="Georgia,serif"
          fontSize="32" fontWeight="700" fill={`url(#${id('gold')})`}
          stroke="#7e570d" strokeWidth=".55" paintOrder="stroke">LA</text>
        <path d="M70 128 H130" stroke={`url(#${id('gold')})`} strokeWidth="1.5" />
        <text x="100" y="141" textAnchor="middle" fontFamily="Georgia,serif"
          fontSize="8" fontWeight="700" letterSpacing="2" fill="#fff2c5">VERIFIED</text>
        <path d="M49 69 Q100 42 151 69" fill="none" stroke="#ffffff"
          strokeOpacity=".2" strokeWidth="1.5" filter={`url(#${id('shine')})`} />
      </g>
    </svg>
  );
}

export default CertificateSeal;
