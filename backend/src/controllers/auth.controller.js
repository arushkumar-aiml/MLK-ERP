const authService = require('../services/auth.service');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { logAuditEvent } = require('../utils/auditLogger');

const isProduction = process.env.NODE_ENV === 'production';

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
};

const refreshCookieOptions = {
  ...cookieOptions,
  path: '/api/auth',
};

function sendAuthResponse(res, statusCode, payload, message) {
  res.cookie('accessToken', payload.accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('refreshToken', payload.refreshToken, {
    ...refreshCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(statusCode).json(
    new ApiResponse(
      statusCode,
      {
        user: payload.user,
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        refreshTokenExpiresAt: payload.expiresAt,
      },
      message
    )
  );
}

async function login(req, res, next) {
  try {
    const { loginId, username, email, password } = req.body;
    const identifier = loginId || username || email;

    if (!password) {
      throw new ApiError(400, 'Password is required');
    }

    const payload = await authService.login({ identifier, password, req });

    await logAuditEvent({
      req,
      actor: payload.user.id,
      school: payload.user.school,
      action: 'auth.login',
      status: 'success',
      metadata: { loginId: payload.user.loginId, role: payload.user.role },
    });

    return sendAuthResponse(res, 200, payload, 'Login successful');
  } catch (error) {
    await logAuditEvent({
      req,
      action: 'auth.login',
      status: 'failure',
      metadata: { identifier: req.body?.loginId || req.body?.username || req.body?.email },
    });
    return next(error);
  }
}

async function logout(req, res, next) {
  try {
    const refreshToken = req.body?.refreshToken || req.cookies?.refreshToken;
    await authService.logout({ refreshToken });

    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', refreshCookieOptions);

    await logAuditEvent({
      req,
      actor: req.user?._id,
      school: req.user?.school,
      action: 'auth.logout',
      status: 'success',
    });

    return res.status(200).json(new ApiResponse(200, null, 'Logout successful'));
  } catch (error) {
    return next(error);
  }
}

async function refreshToken(req, res, next) {
  try {
    const token = req.body?.refreshToken || req.cookies?.refreshToken;
    const payload = await authService.refreshAccessToken({ refreshToken: token, req });

    await logAuditEvent({
      req,
      actor: payload.user.id,
      school: payload.user.school,
      action: 'auth.refresh_token',
      status: 'success',
    });

    return sendAuthResponse(res, 200, payload, 'Token refreshed');
  } catch (error) {
    await logAuditEvent({
      req,
      action: 'auth.refresh_token',
      status: 'failure',
    });
    return next(error);
  }
}

async function profile(req, res, next) {
  try {
    const user = await authService.getProfile(req.user._id);
    return res.status(200).json(new ApiResponse(200, { user }, 'Profile fetched'));
  } catch (error) {
    return next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await authService.changePassword({
      userId: req.user._id,
      currentPassword,
      newPassword,
    });

    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', refreshCookieOptions);

    await logAuditEvent({
      req,
      actor: req.user._id,
      school: req.user.school,
      action: 'auth.change_password',
      status: 'success',
    });

    return res.status(200).json(new ApiResponse(200, { user }, 'Password changed successfully'));
  } catch (error) {
    await logAuditEvent({
      req,
      actor: req.user?._id,
      school: req.user?.school,
      action: 'auth.change_password',
      status: 'failure',
    });
    return next(error);
  }
}

module.exports = {
  changePassword,
  login,
  logout,
  profile,
  refreshToken,
};
