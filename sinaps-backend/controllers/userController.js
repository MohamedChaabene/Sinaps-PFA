const User = require('../models/User');

exports.findOrCreateUser = async (req, res) => {
  try {
    const { name, email, googleId, avatar, credential } = req.body;

    // If Google OAuth credential is provided
    if (credential) {
      try {
        const { OAuth2Client } = require('google-auth-library');
        const googleClientId = process.env.GOOGLE_CLIENT_ID;
        const client = new OAuth2Client(googleClientId);

        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: googleClientId,
        });
        const payload = ticket.getPayload();
        const gEmail = payload.email;
        const gName = payload.name || name || 'Utilisateur Google';
        const gAvatar = payload.picture || avatar;
        const gSub = payload.sub;

        let user = await User.findOne({ email: gEmail });
        if (!user) {
          user = await User.create({ googleId: gSub, name: gName, email: gEmail, avatar: gAvatar });
        }
        return res.json(user);
      } catch (tokenErr) {
        console.warn('Google ID token verification error, falling back to direct values:', tokenErr.message);
      }
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
    res.json(user);
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
