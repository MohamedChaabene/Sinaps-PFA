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
      const googleClientId = process.env.GOOGLE_CLIENT_ID;
      if (!googleClientId) {
        console.error('GOOGLE_CLIENT_ID is not configured on the server.');
        return res.status(500).json({ error: "Authentification Google indisponible (configuration serveur manquante)." });
      }

      let payload;
      try {
        const { OAuth2Client } = require('google-auth-library');
        const client = new OAuth2Client(googleClientId);
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: googleClientId,
        });
        payload = ticket.getPayload();
      } catch (tokenErr) {
        console.warn('Google ID token verification failed:', tokenErr.message);
        return res.status(401).json({ error: "Jeton Google invalide ou expiré. Veuillez réessayer." });
      }

      const gEmail = payload.email;
      const gName = payload.name || 'Utilisateur Google';
      const gAvatar = payload.picture;
      const gSub = payload.sub;

      let user = await User.findOne({ email: gEmail });
      if (!user) {
        user = await User.create({ googleId: gSub, name: gName, email: gEmail, avatar: gAvatar });
      }
      return res.json({ user, token: signClientToken(user._id) });
    }

    if (!email) {
      return res.status(400).json({ error: 'Adresse e-mail requise' });
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        googleId: googleId || email,
        name: name || email.split('@')[0],
        email,
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
    const user = await User.create({ googleId, name, email, avatar });
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
