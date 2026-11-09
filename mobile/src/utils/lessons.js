// Buka lesson sesuai tipenya. Video diputar di Course Detail (di desain mobile nggak ada layar video terpisah).
const ROUTE_FOR = { Article: 'Article', Quiz: 'Quiz', Practice: 'Practice' };

export function lessonRoute(lesson) {
  return ROUTE_FOR[lesson?.type] || null;
}

/**
 * mode 'push'    → dari Course Detail / Profile (lesson ditumpuk di atas)
 * mode 'replace' → pindah antar lesson (Next/Prev), biar stack nggak makin panjang
 */
export function openLesson(navigation, course, lesson, mode = 'push') {
  if (!course || !lesson) return;
  const route = lessonRoute(lesson);
  if (!route) {
    // Lesson video: balik/buka Course Detail lalu langsung putar lesson itu
    const params = { slug: course.slug, playIndex: lesson.index, playNonce: Date.now() };
    const state = navigation.getState?.();
    const inStack = state?.routes?.some((r) => r.name === 'CourseDetail' && r.params?.slug === course.slug);
    if (inStack) navigation.popTo('CourseDetail', params, { merge: true });
    else navigation.navigate('CourseDetail', params);
    return;
  }
  const params = { slug: course.slug, lessonIndex: lesson.index };
  if (mode === 'replace') navigation.replace(route, params);
  else navigation.push(route, params);
}
