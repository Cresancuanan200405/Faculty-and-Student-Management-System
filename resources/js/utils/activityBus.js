/* Global Activity Bus:
   - Listens for app-wide events (student/faculty/courses/departments + SY archive/restore)
   - Persists to localStorage
   - Emits 'dashboardActivitiesUpdated' after each change
*/

(function initActivityBus() {
  if (typeof window === 'undefined') return;

  // Avoid double init
  if (window.__activityBusInitialized) return;

  // If Dashboard already mounted and created its own handlers, skip (it will manage listeners)
  if (window.dashboardEventHandlers) return;

  const read = () => {
    try {
      const saved = localStorage.getItem('dashboard_activities');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };
  const write = (list) => {
    try {
      localStorage.setItem('dashboard_activities', JSON.stringify(list));
    } catch {}
    // Inform any open Dashboard(s)
    try {
      window.dispatchEvent(new CustomEvent('dashboardActivitiesUpdated', {
        detail: { activities: list }
      }));
    } catch {}
  };

  const push = (type, description, entity = null) => {
    const prev = read();
    const item = {
      id: Date.now() + Math.random(),
      type,
      description,
      entity,
      timestamp: new Date()
    };
    const updated = [item, ...prev.slice(0, 19)];
    write(updated);
  };

  const getType = (t) => (String(t || '').split('_')[0] || 'system');

  const createEventHandler = (token, describe) => (e) => {
    try {
      const detail = e?.detail ?? {};
      push(getType(token), describe(detail), detail);
    } catch (err) {
      console.error('activityBus handler error:', err);
    }
  };

  // Handlers
  const handlers = {
    studentAdded: createEventHandler('student_added', s => `New student enrolled: ${s.first_name} ${s.last_name}`),
    studentUpdated: createEventHandler('student_updated', s => `Student profile updated: ${s.first_name} ${s.last_name}`),
    studentDeleted: createEventHandler('student_deleted', s => `Student removed: ${s.first_name || 'Unknown'} ${s.last_name || 'Student'}`),

    facultyAdded: createEventHandler('faculty_added', f => `New faculty member added: ${f.first_name} ${f.last_name}`),
    facultyUpdated: createEventHandler('faculty_updated', f => `Faculty profile updated: ${f.first_name} ${f.last_name}`),
    facultyDeleted: createEventHandler('faculty_deleted', f => `Faculty member removed: ${f.first_name || 'Unknown'} ${f.last_name || 'Faculty'}`),

    courseAdded: createEventHandler('course_added', c => `New course created: ${c?.name || c?.course_name || 'Unknown Course'}`),
    courseUpdated: createEventHandler('course_updated', c => `Course updated: ${c?.name || c?.course_name || 'Unknown Course'}`),
    courseDeleted: createEventHandler('course_deleted', c => `Course deleted: ${c?.name || c?.course_name || 'Unknown Course'}`),

    departmentAdded: createEventHandler('department_added', d => `New program created: ${d?.name || 'Unknown Program'}`),
    departmentUpdated: createEventHandler('department_updated', d => `Program updated: ${d?.name || 'Unknown Program'}`),
    departmentDeleted: createEventHandler('department_deleted', d => `Program deleted: ${d?.name || 'Unknown Program'}`),

    studentYearArchived: createEventHandler('event_studentYearArchived', p => `Students SY archived: ${p?.label || 'Unknown'}`),
    studentYearRestored: createEventHandler('event_studentYearRestored', p => `Students SY restored: ${p?.label || 'Unknown'}`),
    facultyYearArchived: createEventHandler('event_facultyYearArchived', p => `Faculty SY archived: ${p?.label || 'Unknown'}`),
    facultyYearRestored: createEventHandler('event_facultyYearRestored', p => `Faculty SY restored: ${p?.label || 'Unknown'}`),
  };

  Object.entries(handlers).forEach(([name, fn]) => {
    window.addEventListener(name, fn);
  });

  window.__activityBusInitialized = true;
})();