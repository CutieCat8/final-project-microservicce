// Stand-ins for Sea's Course and Safe's Notification services, so Enrollment tests run alone.
const express = require('express');
const { once } = require('node:events');

const courses = ['CS101', 'CS102'];

async function start(app) {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return { server, url: `http://127.0.0.1:${server.address().port}` };
}

function close(server) {
  return server ? new Promise((resolve) => server.close(resolve)) : Promise.resolve();
}

function startCourse() {
  const app = express();
  app.get('/api/courses/:courseId', (req, res) => {
    if (!courses.includes(req.params.courseId)) {
      res.status(404).json({ error: { code: 'COURSE_NOT_FOUND', message: 'Course not found.' } });
      return;
    }
    res.json({ course: { courseId: req.params.courseId, name: `Course ${req.params.courseId}` } });
  });
  return start(app);
}

async function startNotification() {
  const received = [];
  const state = { status: 201 };
  const app = express();
  app.use(express.json());
  app.post('/api/notifications', (req, res) => {
    received.push(req.body);
    res.status(state.status).json({ notification: { ...req.body, message: 'ลงทะเบียนสำเร็จ' } });
  });
  app.get('/api/notifications/:enrollmentId', (req, res) => {
    const notice = received.find((item) => item.enrollmentId === req.params.enrollmentId);
    if (!notice) {
      res.status(404).json({ error: { code: 'NOTIFICATION_NOT_FOUND', message: 'Notification not found.' } });
      return;
    }
    res.json({ notification: { enrollmentId: notice.enrollmentId, message: 'ลงทะเบียนสำเร็จ', createdAt: new Date().toISOString() } });
  });
  return { ...(await start(app)), received, state };
}

module.exports = { start, close, startCourse, startNotification };
