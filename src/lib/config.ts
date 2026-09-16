export const SITE = {
  name: "FeedbackBox",
  tagline: "Get honest, anonymous feedback from anyone.",
  description:
    "FeedbackBox is an open-source, anonymous feedback tool. Share your link, receive candid messages — no sign-up required for senders.",
  repoUrl: "https://github.com/forhadhossin/feedback-box",
  author: {
    name: "Forhad Hossin",
    github: "https://github.com/forhadhossin",
    facebook: "https://facebook.com/forhadhossin", // placeholder
    linkedin: "https://linkedin.com/in/forhadhossin", // placeholder
  },
};

export const MESSAGE_MAX_LENGTH = 1000;
export const MESSAGE_MIN_LENGTH = 1;

export const GOOGLE_OAUTH = {
  enabled:
    !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
  clientId: process.env.GOOGLE_CLIENT_ID ?? "",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  redirectUri:
    process.env.GOOGLE_REDIRECT_URI ??
    "http://localhost:3000/api/auth/google/callback",
  authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenUrl: "https://oauth2.googleapis.com/token",
  userInfoUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
  scope: "openid email profile",
};
