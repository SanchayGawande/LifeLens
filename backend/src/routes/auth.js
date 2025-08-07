const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const Joi = require('joi');

// Validation schemas
const signUpSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().min(2).max(50)
});

const signInSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Sign up
router.post('/signup', async (req, res, next) => {
  try {
    const { error: validationError } = signUpSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message });
    }

    const { email, password, name } = req.body;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0]
        }
      }
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ 
      message: 'User created successfully',
      user: data.user
    });
  } catch (error) {
    next(error);
  }
});

// Sign in
router.post('/signin', async (req, res, next) => {
  try {
    const { error: validationError } = signInSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message });
    }

    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    res.json({ 
      message: 'Signed in successfully',
      session: data.session,
      user: data.user
    });
  } catch (error) {
    next(error);
  }
});

// Sign out
router.post('/signout', async (req, res, next) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Signed out successfully' });
  } catch (error) {
    next(error);
  }
});

// Refresh token
router.post('/refresh', async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const { data, error } = await supabase.auth.refreshSession({ refresh_token });
    
    if (error) {
      return res.status(401).json({ error: error.message });
    }

    res.json({ 
      session: data.session,
      user: data.user
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;