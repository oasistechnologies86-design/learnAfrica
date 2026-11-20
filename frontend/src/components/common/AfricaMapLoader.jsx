import React from 'react';

/** Presentation-only loader; React Suspense and route guards control its lifetime. */
export default function AfricaMapLoader() {
  return (
    <div className="la-africa-loader" role="status" aria-live="polite" aria-label="Loading LearnAfrica">
      <div className="la-africa-loader__visual" aria-hidden="true">
        <svg className="la-africa-loader__art" viewBox="0 0 240 240" focusable="false">
          <defs>
            <linearGradient id="la-africa-fill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#08794d" /><stop offset="100%" stopColor="#073b2b" />
            </linearGradient>
            <clipPath id="la-africa-clip"><path d="M76 26 99 21 119 29 133 25 147 34 158 43 176 49 181 61 174 72 182 83 174 96 166 105 160 119 151 130 147 148 137 165 128 183 116 202 106 193 99 176 91 162 82 145 76 130 66 118 57 101 51 84 54 69 62 54Z" /></clipPath>
          </defs>
          <g className="la-africa-loader__orbit"><circle cx="120" cy="116" r="93"/><circle cx="120" cy="116" r="101"/><circle cx="120" cy="116" r="84"/><path d="M120 15a101 101 0 0 1 101 101"/></g>
          <g className="la-africa-loader__orbit la-africa-loader__orbit--gold"><circle cx="120" cy="116" r="109"/><path d="M11 116a109 109 0 0 0 109 109"/></g>
          <path className="la-africa-loader__continent" d="M76 26 99 21 119 29 133 25 147 34 158 43 176 49 181 61 174 72 182 83 174 96 166 105 160 119 151 130 147 148 137 165 128 183 116 202 106 193 99 176 91 162 82 145 76 130 66 118 57 101 51 84 54 69 62 54Z" fill="url(#la-africa-fill)"/>
          <path className="la-africa-loader__coast" d="M76 26 99 21 119 29 133 25 147 34 158 43 176 49 181 61 174 72 182 83 174 96 166 105 160 119 151 130 147 148 137 165 128 183 116 202 106 193 99 176 91 162 82 145 76 130 66 118 57 101 51 84 54 69 62 54Z"/>
          <g clipPath="url(#la-africa-clip)" className="la-africa-loader__map-lines"><path d="M45 73 181 73M42 91 185 91M48 111 176 111M60 132 165 132M72 151 151 151M88 170 140 170M78 35 78 195M104 20 104 205M132 20 132 200M157 35 157 170M59 84q34 18 60 5t58 12M68 124q29-18 48 5t43 0M86 158q24-19 43-4"/></g>
          <path className="la-africa-loader__madagascar" d="m190 151 7 9-2 17-7 15-5-12 2-17Z"/>
          <g className="la-africa-loader__particles"><circle cx="81" cy="63" r="2"/><circle cx="117" cy="48" r="1.6"/><circle cx="150" cy="70" r="2"/><circle cx="91" cy="111" r="1.7"/><circle cx="133" cy="119" r="2"/><circle cx="109" cy="151" r="1.8"/><circle cx="127" cy="177" r="1.6"/><circle cx="72" cy="94" r="1.4"/></g>
          <circle className="la-africa-loader__sweep" cx="120" cy="116" r="109"/>
          <circle className="la-africa-loader__satellite" cx="120" cy="7" r="3"/>
          <circle className="la-africa-loader__satellite la-africa-loader__satellite--gold" cx="229" cy="116" r="2.5"/>
        </svg>
      </div>
      <span className="la-africa-loader__label">Please wait...</span>
      <span className="sr-only">LearnAfrica is loading the next screen.</span>
    </div>
  );
}
