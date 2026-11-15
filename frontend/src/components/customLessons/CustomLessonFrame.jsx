import React from 'react';
import { Play, Pause, Square, RotateCcw, Volume2 } from 'lucide-react';

const EXCLUDED_READING_NODES = 'button, script, style, textarea, input, select, option, svg, pre, code, [aria-hidden="true"], .custom-lesson-reader-controls, .custom-lesson-completion, .custom-lesson-content-end';

function collectReadingSentences(root) {
  if (!root || typeof document === 'undefined') return { sentences: [], nodes: [] };
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || parent.closest(EXCLUDED_READING_NODES)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const nodes = [];
  let fullText = '';
  let current;
  while ((current = walker.nextNode())) {
    const value = current.nodeValue || '';
    if (!value.trim()) continue;
    // Text nodes can be split by inline formatting elements. Add a real word
    // boundary when adjacent nodes would otherwise run together.
    if (fullText && value && !/\\s$/.test(fullText) && !/^\\s/.test(value)) fullText += ' ';
    const start = fullText.length;
    nodes.push({ node: current, start, end: start + value.length });
    fullText += value;
  }
  let parts = [];
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'sentence' });
    parts = Array.from(segmenter.segment(fullText), item => ({
      text: item.segment.trim(), start: item.index, end: item.index + item.segment.length
    })).filter(item => item.text);
  } else {
    const expression = /[^.!?]+[.!?]+|[^.!?]+$/g;
    let match;
    while ((match = expression.exec(fullText))) {
      const text = match[0].trim();
      if (text) {
        const leading = match[0].indexOf(text);
        parts.push({ text, start: match.index + leading, end: match.index + leading + text.length });
      }
    }
  }
  return { sentences: parts, nodes };
}


const READER_PREFERENCES_KEY = 'learnafrica:custom-reading-preferences:v1';

function readReaderPreferences() {
  const defaults = { rate: 0.8, voiceGender: 'female' };
  if (typeof window === 'undefined') return defaults;
  try {
    const saved = JSON.parse(window.localStorage.getItem(READER_PREFERENCES_KEY) || '{}');
    return {
      rate: [0.8, 1, 1.2].includes(Number(saved.rate)) ? Number(saved.rate) : defaults.rate,
      voiceGender: ['female', 'male'].includes(saved.voiceGender) ? saved.voiceGender : defaults.voiceGender,
    };
  } catch {
    return defaults;
  }
}

const VOICE_GENDER_PATTERNS = {
  female: /\b(female|woman|girl|zira|samantha|karen|moira|tessa|victoria|susan|aria|jenny|libby|hazel|sara|google uk english female|google us english female)\b/i,
  male: /\b(male|man|boy|david|mark|guy|alex|daniel|james|aaron|fred|tom|george|ryan|oliver|liam|matthew|google uk english male|google us english male)\b/i
};

function findVoiceForGender(voices, gender) {
  const pattern = VOICE_GENDER_PATTERNS[gender];
  if (!pattern) return null;
  const matching = voices.filter(voice => pattern.test(`${voice.gender || ''} ${voice.name || ''} ${voice.voiceURI || ''}`));
  const english = matching.filter(voice => /^en([_-]|$)/i.test(voice.lang || ''));
  return english[0] || matching[0] || null;
}

function makeSentenceRange(sentence, nodes) {
  if (!sentence || !nodes.length) return null;
  const first = nodes.find(item => item.end > sentence.start);
  const last = [...nodes].reverse().find(item => item.start < sentence.end);
  if (!first || !last) return null;
  const range = document.createRange();
  range.setStart(first.node, Math.max(0, sentence.start - first.start));
  range.setEnd(last.node, Math.min(last.node.nodeValue.length, sentence.end - last.start));
  return range;
}

export default function CustomLessonFrame({
  lesson, children, mode = 'student', studentId, onComplete,
  isCompleted = false, isSaving = false, navigationOpen = false
}) {
  const readingRef = React.useRef(null);
  const contentRef = React.useRef(null);
  const sentenceNodesRef = React.useRef([]);
  const sentencesRef = React.useRef([]);
  const sessionRef = React.useRef(0);
  const fallbackHighlightRef = React.useRef(null);
  const [readerPreferences] = React.useState(readReaderPreferences);
  const [rate, setRate] = React.useState(readerPreferences.rate);
  const [voiceGender, setVoiceGender] = React.useState(readerPreferences.voiceGender);
  const rateRef = React.useRef(rate);
  const currentSentenceRef = React.useRef(0);
  const speechStartTimerRef = React.useRef(null);
  const wasPlayingBeforeSeekRef = React.useRef(false);
  const voicesRef = React.useRef([]);
  const voiceGenderRef = React.useRef(voiceGender);
  const canComplete = mode === 'student' && typeof onComplete === 'function';
  const canRemember = mode === 'student' && Boolean(studentId) && Boolean(lesson?.id);
  const storageKey = canRemember ? `learnafrica:custom-reading:${studentId}:${lesson.id}` : null;
  const [showReadingCue, setShowReadingCue] = React.useState(true);
  const [sentences, setSentences] = React.useState([]);
  const [currentSentence, setCurrentSentence] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const [voices, setVoices] = React.useState([]);
  const [speechSupported, setSpeechSupported] = React.useState(false);
  const [savedPosition, setSavedPosition] = React.useState(false);
  const [readerStatus, setReaderStatus] = React.useState('Ready to read.');
  const femaleVoiceAvailable = Boolean(findVoiceForGender(voices, 'female'));
  const maleVoiceAvailable = Boolean(findVoiceForGender(voices, 'male'));

  const getScrollContainer = () => {
    const article = readingRef.current;
    if (!article) return null;
    const main = article.closest('main');
    if (main && main.scrollHeight > main.clientHeight) return main;
    return document.scrollingElement || document.documentElement;
  };

  const advanceReading = () => {
    const container = getScrollContainer();
    if (!container) return;
    const isDocumentScroll = container === document.scrollingElement || container === document.documentElement;
    const currentTop = isDocumentScroll ? window.scrollY : container.scrollTop;
    const viewportHeight = container.clientHeight || window.innerHeight;
    const step = Math.min(420, Math.max(220, Math.round(viewportHeight * 0.48)));
    const nextTop = currentTop + step;
    if (isDocumentScroll) window.scrollTo({ top: nextTop, behavior: 'smooth' });
    else container.scrollTo({ top: nextTop, behavior: 'smooth' });
  };

  const clearSentenceHighlight = React.useCallback(() => {
    if (typeof window !== 'undefined' && window.CSS?.highlights) {
      window.CSS.highlights.delete('custom-lesson-current-sentence');
    }
    if (fallbackHighlightRef.current) {
      fallbackHighlightRef.current.classList.remove('custom-lesson-reading-active');
      fallbackHighlightRef.current = null;
    }
  }, []);

  const highlightSentence = React.useCallback((index) => {
    clearSentenceHighlight();
    const sentence = sentencesRef.current[index];
    if (!sentence || typeof document === 'undefined') return;
    const range = makeSentenceRange(sentence, sentenceNodesRef.current);
    if (!range) return;
    if (typeof window !== 'undefined' && window.CSS?.highlights && typeof window.Highlight === 'function') {
      try {
        window.CSS.highlights.set('custom-lesson-current-sentence', new window.Highlight(range));
        return;
      } catch {
        // Fall back to highlighting the sentence's paragraph on older browsers.
      }
    }
    const element = range.startContainer.parentElement;
    const block = element?.closest('p, li, h1, h2, h3, h4, blockquote') || element;
    if (block) {
      block.classList.add('custom-lesson-reading-active');
      fallbackHighlightRef.current = block;
    }
  }, [clearSentenceHighlight]);

  const speakAt = React.useCallback((index, session) => {
    const sentence = sentencesRef.current[index];
    if (!sentence || typeof window === 'undefined' || !window.speechSynthesis) {
      setIsPlaying(false);
      setIsPaused(false);
      return;
    }
    setCurrentSentence(index);
    currentSentenceRef.current = index;
    highlightSentence(index);
    const utterance = new window.SpeechSynthesisUtterance(sentence.text);
    utterance.rate = rateRef.current;
    const selectedVoice = findVoiceForGender(voicesRef.current, voiceGenderRef.current);
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.onstart = () => {
      if (session !== sessionRef.current) return;
      if (speechStartTimerRef.current) window.clearTimeout(speechStartTimerRef.current);
      speechStartTimerRef.current = null;
      setReaderStatus('Reading aloud now.');
    };
    utterance.onend = () => {
      if (session !== sessionRef.current) return;
      if (speechStartTimerRef.current) window.clearTimeout(speechStartTimerRef.current);
      speechStartTimerRef.current = null;
      if (index + 1 < sentencesRef.current.length) speakAt(index + 1, session);
      else {
        setIsPlaying(false);
        setIsPaused(false);
        const lastSentence = Math.max(0, sentencesRef.current.length - 1);
        setCurrentSentence(lastSentence);
        currentSentenceRef.current = lastSentence;
        setReaderStatus('Finished reading. Press Restart to listen again.');
      }
    };
    utterance.onerror = (event) => {
      if (session !== sessionRef.current || event.error === 'canceled' || event.error === 'interrupted') return;
      if (speechStartTimerRef.current) window.clearTimeout(speechStartTimerRef.current);
      speechStartTimerRef.current = null;
      setIsPlaying(false);
      setIsPaused(false);
      setReaderStatus('Your device stopped the audio. Please check its text-to-speech voice settings and try again.');
    };
    try {
      // Resume and speak immediately inside the Play tap. Some mobile browsers
      // suspend speech until resume() is called after a previous cancel/pause.
      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utterance);
      if (speechStartTimerRef.current) window.clearTimeout(speechStartTimerRef.current);
      speechStartTimerRef.current = window.setTimeout(() => {
        if (session !== sessionRef.current) return;
        // Some mobile speech engines accept the request but never start it.
        setIsPlaying(false);
        setIsPaused(false);
        setReaderStatus('Audio did not start on this device. Check that text-to-speech is enabled, then press Play again.');
        // Ignore any late events from this request after the timeout.
        sessionRef.current += 1;
        window.speechSynthesis.cancel();
      }, 7000);
    } catch {
      if (speechStartTimerRef.current) window.clearTimeout(speechStartTimerRef.current);
      speechStartTimerRef.current = null;
      setIsPlaying(false);
      setIsPaused(false);
      setReaderStatus('Audio could not start. Please try Play again.');
    }
  }, [highlightSentence]);

  const playFrom = React.useCallback((index) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !sentencesRef.current.length) return;
    sessionRef.current += 1;
    const session = sessionRef.current;
    if (speechStartTimerRef.current) window.clearTimeout(speechStartTimerRef.current);
    speechStartTimerRef.current = null;
    window.speechSynthesis.cancel();
    setIsPaused(false);
    setIsPlaying(true);
    setReaderStatus('Starting audio...');
    // Do not defer this call: mobile browsers may require the speech request
    // to happen directly from the user's tap.
    speakAt(Math.max(0, Math.min(index, sentencesRef.current.length - 1)), session);
  }, [speakAt]);

  const stopReading = React.useCallback(() => {
    sessionRef.current += 1;
    if (speechStartTimerRef.current) window.clearTimeout(speechStartTimerRef.current);
    speechStartTimerRef.current = null;
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setReaderStatus('Reading stopped.');
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return undefined;
    const updateVoices = () => {
      const available = window.speechSynthesis.getVoices() || [];
      voicesRef.current = available;
      setVoices(available);
    };
    updateVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged', updateVoices);
    return () => window.speechSynthesis.removeEventListener?.('voiceschanged', updateVoices);
  }, []);

  React.useEffect(() => {
    if (typeof document === 'undefined' || !window.CSS?.highlights) return undefined;
    const style = document.createElement('style');
    style.setAttribute('data-custom-lesson-highlight', 'true');
    style.textContent = `::highlight(custom-lesson-current-sentence) {
      background: color-mix(in oklab, var(--primary) 24%, transparent);
      color: inherit;
      text-decoration: underline;
      text-decoration-color: var(--primary);
      text-decoration-thickness: 2px;
      text-underline-offset: 3px;
    }`;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  React.useEffect(() => {
    const supported = typeof window !== 'undefined'
      && 'speechSynthesis' in window
      && typeof window.SpeechSynthesisUtterance === 'function';
    setSpeechSupported(supported);
    const result = collectReadingSentences(contentRef.current);
    sentencesRef.current = result.sentences;
    sentenceNodesRef.current = result.nodes;
    setSentences(result.sentences);
    let saved = 0;
    if (storageKey) {
      try {
        const stored = Number(window.localStorage.getItem(storageKey));
        if (Number.isInteger(stored) && stored > 0) saved = Math.min(stored, Math.max(0, result.sentences.length - 1));
      } catch {
        // Reading remains available when browser storage is disabled.
      }
    }
    setCurrentSentence(saved);
    currentSentenceRef.current = saved;
    setSavedPosition(saved > 0);
    if (saved > 0) highlightSentence(saved);
    return () => {
      sessionRef.current += 1;
      if (speechStartTimerRef.current) window.clearTimeout(speechStartTimerRef.current);
      speechStartTimerRef.current = null;
      if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
      clearSentenceHighlight();
    };
  }, [lesson?.id, storageKey, clearSentenceHighlight, highlightSentence]);

  React.useEffect(() => {
    if (storageKey && sentences.length) {
      try {
        window.localStorage.setItem(storageKey, String(currentSentence));
      } catch {
        // Storage restrictions must not interrupt the lesson.
      }
    }
  }, [storageKey, sentences.length, currentSentence]);

  React.useEffect(() => {
    highlightSentence(currentSentence);
  }, [currentSentence, sentences, highlightSentence]);

  React.useEffect(() => {
    const container = getScrollContainer();
    if (!container) return undefined;
    const isDocumentScroll = container === document.scrollingElement || container === document.documentElement;
    const updateCueVisibility = () => {
      if (navigationOpen) {
        setShowReadingCue(false);
        return;
      }
      const currentTop = isDocumentScroll ? window.scrollY : container.scrollTop;
      const viewportHeight = container.clientHeight || window.innerHeight;
      const maxTop = Math.max(0, container.scrollHeight - viewportHeight);
      const remaining = maxTop - currentTop;
      setShowReadingCue(maxTop > 80 && remaining > Math.max(220, viewportHeight * 0.42));
    };
    updateCueVisibility();
    const target = isDocumentScroll ? window : container;
    target.addEventListener('scroll', updateCueVisibility, { passive: true });
    window.addEventListener('resize', updateCueVisibility);
    return () => {
      target.removeEventListener('scroll', updateCueVisibility);
      window.removeEventListener('resize', updateCueVisibility);
    };
  }, [navigationOpen, lesson?.id]);

  const handlePlay = () => {
    if (!speechSupported) {
      setReaderStatus('Audio reading is not available in this browser. Try opening LearnAfrica in Chrome.');
      return;
    }
    if (!sentencesRef.current.length) {
      setReaderStatus('No lesson text was found to read aloud.');
      return;
    }
    if (!findVoiceForGender(voicesRef.current, voiceGenderRef.current)) {
      const voiceLabel = voiceGenderRef.current === 'male' ? 'Male' : 'Female';
      setReaderStatus(`${voiceLabel} voice is not available on this device. Install or enable an English ${voiceLabel.toLowerCase()} text-to-speech voice in your device settings.`);
      return;
    }
    if (isPaused) {
      // Restart the current sentence instead of relying on native resume().
      // Several mobile speech engines lose their paused queue after a short wait.
      playFrom(currentSentenceRef.current);
      return;
    }
    playFrom(currentSentenceRef.current);
  };
  const handlePause = () => {
    if (!isPlaying || !window.speechSynthesis) return;
    // Invalidate callbacks from the old utterance before cancelling it.
    // Resume will speak the current sentence again, so progress is not lost.
    sessionRef.current += 1;
    if (speechStartTimerRef.current) window.clearTimeout(speechStartTimerRef.current);
    speechStartTimerRef.current = null;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(true);
    setReaderStatus('Paused. Press Resume to continue from this sentence.');
  };
  const handleRestart = () => {
    currentSentenceRef.current = 0;
    setCurrentSentence(0);
    setSavedPosition(false);
    playFrom(0);
  };
  const handleSeek = (event) => {
    const next = Number(event.target.value);
    currentSentenceRef.current = next;
    setCurrentSentence(next);
    setSavedPosition(false);
  };
  const finishSeek = () => {
    if (wasPlayingBeforeSeekRef.current) playFrom(currentSentenceRef.current);
    wasPlayingBeforeSeekRef.current = false;
  };
  const handleRateChange = (event) => {
    const nextRate = Number(event.target.value);
    rateRef.current = nextRate;
    setRate(nextRate);
    if (isPlaying) playFrom(currentSentenceRef.current);
  };
  const handleVoiceChange = (event) => {
    const nextGender = event.target.value;
    voiceGenderRef.current = nextGender;
    setVoiceGender(nextGender);
    if (isPlaying) {
      if (findVoiceForGender(voicesRef.current, nextGender)) playFrom(currentSentenceRef.current);
      else {
        stopReading();
        setReaderStatus(`${nextGender === 'male' ? 'Male' : 'Female'} voice is not available on this device. Enable a matching voice in your device settings.`);
      }
    }
  };

  const heroTitle = lesson?.title || 'Explore, understand and apply what you learn.';

  return (
    <div className="custom-lesson-page" data-custom-lesson-mode={mode}>
      <section className="custom-lesson-hero" aria-label="Lesson introduction">
        <img className="custom-lesson-hero-photo" src="https://images.pexels.com/photos/5965650/pexels-photo-5965650.jpeg?auto=compress&cs=tinysrgb&w=2000"
          alt="A student studying outdoors on a laptop with a notebook beside her" loading="eager" />
        <div className="custom-lesson-hero-copy"><h1>{heroTitle}</h1></div>
      </section>
      <section className="custom-lesson-reader-controls" aria-label="Read lesson aloud">
        <div className="custom-lesson-reader-heading">
          <span><Volume2 aria-hidden="true" /> Listen to this lesson</span>
          {savedPosition && mode === 'student' && <small>Your last reading position is saved on this device.</small>}
        </div>
        {speechSupported ? (
          <>
            <div className={`custom-lesson-reader-status ${isPlaying ? 'is-active' : ''} ${readerStatus === 'Starting audio...' ? 'is-starting' : ''}`} role="status" aria-live="polite">
              <span className="custom-lesson-reader-indicator" aria-hidden="true"><i /><i /><i /><i /></span>
              <span>{readerStatus}</span>
            </div>
            <div className="custom-lesson-reader-actions">
              <button type="button" onClick={handlePlay} disabled={!sentences.length || isPlaying} aria-label={isPlaying ? 'Reading aloud' : isPaused ? 'Resume reading' : 'Play reading'}>
                <Play aria-hidden="true" /> {isPlaying ? 'Playing...' : isPaused ? 'Resume' : 'Play'}
              </button>
              <button type="button" onClick={handlePause} disabled={!isPlaying} aria-label="Pause reading">
                <Pause aria-hidden="true" /> Pause
              </button>
              <button type="button" onClick={stopReading} disabled={!isPlaying && !isPaused} aria-label="Stop reading">
                <Square aria-hidden="true" /> Stop
              </button>
              <button type="button" onClick={handleRestart} disabled={!sentences.length} aria-label="Restart reading from the beginning">
                <RotateCcw aria-hidden="true" /> Restart
              </button>
              <label className="custom-lesson-reader-speed">
                <span>Voice</span>
                <select value={voiceGender} onChange={handleVoiceChange} aria-label="Narration voice">
                  <option value="female">Woman{femaleVoiceAvailable ? '' : ' (not detected)'}</option>
                  <option value="male">Man{maleVoiceAvailable ? '' : ' (not detected)'}</option>
                </select>
              </label>
              <label className="custom-lesson-reader-speed">
                <span>Speed</span>
                <select value={rate} onChange={handleRateChange} aria-label="Reading speed">
                  <option value="0.8">Slow</option>
                  <option value="1">Normal</option>
                  <option value="1.2">Fast</option>
                </select>
              </label>
            </div>
            <div className="custom-lesson-reader-timeline">
              <span>Reading progress</span>
              <input type="range" min="0" max={Math.max(0, sentences.length - 1)} step="1"
                value={Math.min(currentSentence, Math.max(0, sentences.length - 1))}
                onPointerDown={() => { wasPlayingBeforeSeekRef.current = isPlaying; }}
                onPointerUp={finishSeek}
                onPointerCancel={finishSeek}
                onKeyDown={() => { wasPlayingBeforeSeekRef.current = isPlaying; }}
                onKeyUp={finishSeek}
                onChange={handleSeek} disabled={!sentences.length}
                aria-label="Move to a sentence in the lesson" />
              <small>{sentences.length ? `Sentence ${Math.min(currentSentence + 1, sentences.length)} of ${sentences.length}` : 'No reading text found'}</small>
            </div>
            <p className="custom-lesson-reader-note">The highlighted sentence follows the narration. Move the progress bar to jump to another sentence.</p>
          </>
        ) : (
          <p className="custom-lesson-reader-note">Audio reading is not supported by this browser. You can still read the lesson normally.</p>
        )}
      </section>
      <article ref={readingRef} className="custom-lesson-system" aria-label={lesson?.title || 'Custom lesson'}>
        <div ref={contentRef} className="custom-lesson-reading-content">{children}</div>
        {canComplete && (
          <section className="custom-lesson-completion" aria-label="Complete this lesson">
            <p>You've reached the end of this lesson. Click below to mark it as complete and continue to your next lesson.</p>
            {isCompleted ? (
              <button type="button" className="is-completed" disabled aria-label="Lesson completed">FINISHED <span aria-hidden="true">✓</span></button>
            ) : (
              <button type="button" onClick={onComplete} disabled={isSaving}>{isSaving ? 'SAVING...' : 'MARK AS COMPLETE'}</button>
            )}
          </section>
        )}
        <div className="custom-lesson-content-end" aria-hidden="true" />
      </article>
      {!navigationOpen && showReadingCue && (
        <div className="custom-lesson-sticky-action">
          <button type="button" onClick={advanceReading} aria-label="Continue reading by scrolling down">
            <span className="custom-lesson-scroll-label">Keep reading <span aria-hidden="true">·</span> Completion is at the end</span>
            <span className="custom-lesson-scroll-arrow" aria-hidden="true">↓</span>
          </button>
        </div>
      )}
    </div>
  );
}
