const noticeService = require('./notice.service');

const create = async (req, res) => {
  try {
    const io = req.app.get('io');
    const notice = await noticeService.createNotice(req.user, req.body, io);
    res.status(201).json({ success: true, data: notice });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const getAll = async (req, res) => {
  try {
    const notices = await noticeService.getNotices(req.user.societyId);
    const stats = await noticeService.getNoticeStats(req.user.societyId);
    res.status(200).json({ success: true, data: notices, stats });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const io = req.app.get('io');
    const notice = await noticeService.updateNotice(req.user, req.params.id, req.body, io);
    res.status(200).json({ success: true, data: notice });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const io = req.app.get('io');
    await noticeService.deleteNotice(req.user, req.params.id, io);
    res.status(200).json({ success: true, message: 'Notice deleted' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const togglePin = async (req, res) => {
  try {
    const io = req.app.get('io');
    const notice = await noticeService.togglePin(req.user, req.params.id, io);
    res.status(200).json({ success: true, data: notice });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = { create, getAll, update, remove, togglePin };
