const ROLE_PREFIX = {
  superadmin: 'SADM',
  admin: 'ADM',
  principal: 'PRI',
  teacher: 'TCH',
  student: 'STD',
};

function normalizeSequence(sequence) {
  return String(sequence).padStart(3, '0');
}

function normalizeSchoolCode(schoolCode) {
  if (!schoolCode) {
    throw new Error('School code is required for this role');
  }

  return String(schoolCode).trim().toUpperCase();
}

function generateLoginId({ role, schoolCode, year, sequence = 1 }) {
  const prefix = ROLE_PREFIX[role];

  if (!prefix) {
    throw new Error(`Unsupported role for login ID: ${role}`);
  }

  if (role === 'superadmin') {
    return `${prefix}-${normalizeSequence(sequence)}`;
  }

  const code = normalizeSchoolCode(schoolCode);

  if (role === 'student') {
    if (!year || !/^\d{4}$/.test(String(year))) {
      throw new Error('A four-digit admission year is required for student login IDs');
    }

    return `${prefix}-${code}-${year}-${normalizeSequence(sequence)}`;
  }

  return `${prefix}-${code}-${normalizeSequence(sequence)}`;
}

module.exports = generateLoginId;
