function extractSequence(value) {
  const match = String(value || '').match(/-(\d+)$/);
  return match ? Number(match[1]) : 0;
}

async function getNextSequence(Model, query, fieldName) {
  const latest = await Model.findOne(query).sort({ createdAt: -1 }).select(fieldName).lean();
  return extractSequence(latest?.[fieldName]) + 1;
}

function padSequence(sequence, size = 3) {
  return String(sequence).padStart(size, '0');
}

module.exports = {
  getNextSequence,
  padSequence,
};
