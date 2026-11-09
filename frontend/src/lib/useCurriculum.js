import { useState } from 'react';

// Use built-in crypto.randomUUID() - no external package needed
const uid = () => crypto.randomUUID();

export function useCurriculum(initialData = []) {
  const [sections, setSections] = useState(initialData);

  const addSection = (title = 'New Section') => {
    setSections(prev => [...prev, { id: uid(), title, lessons: [] }]);
  };

  const removeSection = (sectionId) => {
    setSections(prev => prev.filter(s => s.id !== sectionId));
  };

  const updateSectionTitle = (sectionId, newTitle) => {
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, title: newTitle } : s));
  };

  const moveSection = (sectionId, direction) => {
    setSections(prev => {
      const index = prev.findIndex(section => section.id === sectionId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const importQuizzes = (quizzes, sectionId) => {
    if (!sectionId || !Array.isArray(quizzes) || !quizzes.length) return;
    setSections(prev => prev.map(section => section.id === sectionId
      ? { ...section, lessons: [...(section.lessons || []), ...quizzes] } : section));
  };
  const moveLesson = (sectionId, lessonId, direction) => setSections(prev => prev.map(section => {
    if (section.id !== sectionId) return section;
    const lessons = [...(section.lessons || [])];
    const index = lessons.findIndex(lesson => lesson.id === lessonId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= lessons.length) return section;
    [lessons[index], lessons[target]] = [lessons[target], lessons[index]];
    return { ...section, lessons };
  }));

  const addLesson = (sectionId, type = 'video', title = '') => {
    const newLesson = {
      id: uid(),
      title: title || (
        type === 'quiz'   ? 'New Quiz' :
        type === 'text'   ? 'New Text Lesson' :
        type === 'custom' ? 'New Custom Page' :
                            'New Lesson'
      ),
      type,
      content: '',
      videoUrl: '',
      duration: '',
      text_content: type === 'text' ? '' : undefined,
      duration_seconds: 0,
      quiz_duration_seconds: 0,
      quiz_timer_enabled: false,
      component_key: type === 'custom' ? '' : undefined,
      componentKey:  type === 'custom' ? '' : undefined,
      questions: type === 'quiz' ? [] : undefined,
    };
    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? { ...section, lessons: [...section.lessons, newLesson] }
        : section
    ));
  };

  const updateLesson = (sectionId, lessonId, updates) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? { ...section, lessons: section.lessons.map(l => l.id === lessonId ? { ...l, ...updates } : l) }
        : section
    ));
  };

  const removeLesson = (sectionId, lessonId) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? { ...section, lessons: section.lessons.filter(l => l.id !== lessonId) }
        : section
    ));
  };

  return { sections, addSection, removeSection, updateSectionTitle, moveSection, importQuizzes, addLesson, updateLesson, removeLesson, moveLesson };
}
