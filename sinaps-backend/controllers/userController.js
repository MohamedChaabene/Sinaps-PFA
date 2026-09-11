const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Client sessions are lower-privilege and longer-lived than agent sessions:
// a support conversation can span days, and re-doing Google sign-in every
// time would be a poor experience for what is just "prove you're this user".
function signClientToken(userId) {
  return jwt.sign({ id: userId.toString(), role: 'client' }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

exports.findOrCreateUser = async (req, res) => {
  try {
    const { name, email, googleId, avatar, credential } = req.body;

    // If a Google OAuth credential is provided, it MUST verify successfully.
    // We never fall back to the client-supplied name/email in this branch:
    // that would let anyone bypass Google auth by sending a fake credential.
    if (credential) {
      const googleClientIds = (process.env.GOOGLE_CLIENT_IDS || process.env.GOOGLE_CLIENT_ID || '')
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
      if (!googleClientIds.length) {
        console.error('GOOGLE_CLIENT_ID(S) is not configured on the server.');
        return res.status(500).json({ error: "Authentification Google indisponible (configuration serveur manquante)." });
      }

      let payload;
      try {
        const { OAuth2Client } = require('google-auth-library');
        const client = new OAuth2Client();
        const ticket = await client.verifyIdToken({
          idToken: credential,
          // Android, iOS and web issue tokens with different audiences.
          audience: googleClientIds,
        });
        payload = ticket.getPayload();
      } catch (tokenErr) {
        console.warn('Google ID token verification failed:', tokenErr.message);
        return res.status(401).json({ error: "Jeton Google invalide ou expiré. Veuillez réessayer." });
      }

      const gEmail = payload.email ? payload.email.toLowerCase().trim() : '';
      const gName = payload.name || 'Utilisateur Google';
      const gAvatar = payload.picture;
      const gSub = payload.sub;

      let user = await User.findOne({ email: gEmail });
      if (!user) {
        user = await User.create({ googleId: gSub, name: gName, email: gEmail, avatar: gAvatar });
      } else if (!user.googleId || user.googleId === user.email) {
        // Link Google ID if account was previously created as guest
        user.googleId = gSub;
        if (gAvatar && !user.avatar) user.avatar = gAvatar;
        await user.save();
      }
      return res.json({ user, token: signClientToken(user._id) });
    }

    const cleanEmail = email ? email.toLowerCase().trim() : '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'Adresse e-mail valide requise' });
    }

    let user = await User.findOne({ email: cleanEmail });
    if (user) {
      // Protection: if account is linked to a verified Google ID (sub != email), reject passwordless email login
      if (user.googleId && user.googleId !== user.email && !user.googleId.includes('@')) {
        return res.status(403).json({
          error: 'Ce compte est associé à Google. Veuillez vous connecter avec le bouton Google.',
        });
      }
    } else {
      user = await User.create({
        googleId: cleanEmail,
        name: name ? name.trim() : cleanEmail.split('@')[0],
        email: cleanEmail,
        avatar,
      });
    }
    res.json({ user, token: signClientToken(user._id) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { googleId, name, email, avatar } = req.body;
    const cleanEmail = email ? email.toLowerCase().trim() : '';
    const user = await User.create({ googleId: googleId || cleanEmail, name, email: cleanEmail, avatar });
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
