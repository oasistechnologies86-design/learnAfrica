const asText = (value) => String(value ?? '').trim();

const QUESTION_TYPES = {
  mcq: 'mcq',
  single_choice: 'mcq',
  single_answer: 'mcq',
  multiple_choice: 'mcq',
  mcq_multi: 'mcq_multi',
  multiple_answer: 'mcq_multi',
  multiple_answers: 'mcq_multi',
  multi_select: 'mcq_multi',
  multiple_select: 'mcq_multi',
  true_false: 'true_false',
  'true/false': 'true_false',
  fill_blank: 'fill_blank',
  fill_in_blank: 'fill_blank',
};

function normaliseQuestion(raw, quizIndex, questionIndex) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error(`Quiz ${quizIndex + 1}, question ${questionIndex + 1} must be an object.`);
  }
  const text = asText(raw.text ?? raw.question ?? raw.question_text);
  if (!text) throw new Error(`Quiz ${quizIndex + 1}, question ${questionIndex + 1} is missing its question text.`);

  const rawType = asText(raw.type ?? raw.question_type ?? 'mcq').toLowerCase().replace(/[ -]/g, '_');
  const question_type = QUESTION_TYPES[rawType];
  if (!question_type) {
    throw new Error(`Quiz ${quizIndex + 1}, question ${questionIndex + 1} has an unsupported type: ${rawType}.`);
  }

  if (question_type === 'fill_blank') {
    const answer = asText(raw.correct_answer ?? raw.correctAnswer ?? raw.answer);
    if (!answer) throw new Error(`Quiz ${quizIndex + 1}, question ${questionIndex + 1} needs a correct_answer.`);
    return { text, question_type, options: [answer], correctAnswer: 0 };
  }

  if (question_type === 'true_false') {
    const answer = raw.correct_answer ?? raw.correctAnswer ?? raw.answer;
    let correctAnswer;
    if (typeof answer === 'boolean') correctAnswer = answer ? 0 : 1;
    else if (String(answer).toLowerCase() === 'true') correctAnswer = 0;
    else if (String(answer).toLowerCase() === 'false') correctAnswer = 1;
    else correctAnswer = Number(answer);
    if (![0, 1].includes(correctAnswer)) {
      throw new Error(`Quiz ${quizIndex + 1}, question ${questionIndex + 1} true/false correct_answer must be true, false, 0 or 1.`);
    }
    return { text, question_type, options: ['True', 'False'], correctAnswer };
  }

  const options = Array.isArray(raw.options) ? raw.options.map(asText) : [];
  if (options.length < 2 || options.some(option => !option)) {
    throw new Error(`Quiz ${quizIndex + 1}, question ${questionIndex + 1} needs at least two non-empty options.`);
  }

  if (question_type === 'mcq_multi') {
    const answers = raw.correct_answers ?? raw.correctAnswer ?? raw.correct_answer;
    if (!Array.isArray(answers)) {
      throw new Error(`Quiz ${quizIndex + 1}, question ${questionIndex + 1} must provide correct_answers as an array of option indexes.`);
    }
    const correctAnswer = [...new Set(answers.map(Number))];
    if (correctAnswer.length < 2 || correctAnswer.some(index => !Number.isInteger(index) || index < 0 || index >= options.length)) {
      throw new Error(`Quiz ${quizIndex + 1}, question ${questionIndex + 1} must mark at least two valid option indexes as correct.`);
    }
    return { text, question_type, options, correctAnswer };
  }

  const correctAnswer = Number(raw.correct_answer ?? raw.correctAnswer ?? raw.answer_index ?? 0);
  if (!Number.isInteger(correctAnswer) || correctAnswer < 0 || correctAnswer >= options.length) {
    throw new Error(`Quiz ${quizIndex + 1}, question ${questionIndex + 1} has an invalid correct_answer option index.`);
  }
  return { text, question_type, options, correctAnswer };
}

export function parseQuizImport(payload, existingSections = []) {
  const entries = Array.isArray(payload) ? payload : payload?.quizzes;
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error('The JSON file must contain a non-empty quizzes array.');
  }

  return entries.map((raw, quizIndex) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new Error(`Quiz ${quizIndex + 1} must be an object.`);
    }
    const title = asText(raw.title ?? raw.name);
    if (!title) throw new Error(`Quiz ${quizIndex + 1} is missing its title.`);
    if (!Array.isArray(raw.questions) || raw.questions.length === 0) {
      throw new Error(`Quiz "${title}" must contain at least one question.`);
    }

    const settings = raw.settings && typeof raw.settings === 'object' ? raw.settings : raw;
    const questions = raw.questions.map((question, questionIndex) =>
      normaliseQuestion(question, quizIndex, questionIndex)
    );
    const attempts_enabled = Boolean(settings.attempts_enabled);
    const max_attempts = Math.max(0, Number(settings.max_attempts) || 0);
    const extra_attempt_price = Math.max(0, Number(settings.extra_attempt_price) || 0);
    const pass_score = Number(settings.pass_score ?? 70);
    const quiz_timer_enabled = Boolean(settings.timer_enabled ?? settings.quiz_timer_enabled);
    const quiz_duration_seconds = quiz_timer_enabled
      ? Math.max(1, Number(settings.duration_seconds ?? settings.quiz_duration_seconds) || 600)
      : 0;
    const rawQuestionsPerAttempt = Number(settings.questions_per_attempt) || 0;
    if (!Number.isInteger(rawQuestionsPerAttempt) || rawQuestionsPerAttempt < 0) {
      throw new Error(`Quiz "${title}" questions_per_attempt must be a non-negative whole number.`);
    }
    const questions_per_attempt = rawQuestionsPerAttempt;

    if (!Number.isInteger(pass_score) || pass_score < 1 || pass_score > 100) {
      throw new Error(`Quiz "${title}" pass_score must be a whole number from 1 to 100.`);
    }
    if (attempts_enabled && (!Number.isInteger(max_attempts) || max_attempts < 1 || max_attempts > 50 || extra_attempt_price <= 0)) {
      throw new Error(`Quiz "${title}" with attempts_enabled needs max_attempts from 1 to 50 and an extra_attempt_price greater than zero.`);
    }
    if (questions_per_attempt > questions.length) {
      throw new Error(`Quiz "${title}" questions_per_attempt cannot exceed its question count.`);
    }

    const requestedSectionIndex = raw.section_index;
    let section_title = asText(raw.section_title ?? raw.section);
    if (requestedSectionIndex !== undefined && requestedSectionIndex !== null && requestedSectionIndex !== '') {
      const index = Number(requestedSectionIndex);
      if (!Number.isInteger(index) || index < 0 || index >= existingSections.length) {
        throw new Error(`Quiz "${title}" has an invalid section_index. Section indexes start at 0.`);
      }
      section_title = asText(existingSections[index]?.title) || `Section ${index + 1}`;
    }
    if (!section_title) section_title = asText(existingSections[0]?.title) || 'Imported Quizzes';

    return {
      id: crypto.randomUUID(),
      title,
      description: asText(raw.description),
      type: 'quiz',
      section_title,
      is_final: Boolean(raw.is_final ?? settings.is_final),
      attempts_enabled,
      max_attempts,
      extra_attempt_price,
      pass_score,
      quiz_timer_enabled,
      quiz_duration_seconds,
      questions_per_attempt,
      shuffle_questions: Boolean(settings.shuffle_questions),
      shuffle_options: Boolean(settings.shuffle_options),
      questions,
    };
  });
}
