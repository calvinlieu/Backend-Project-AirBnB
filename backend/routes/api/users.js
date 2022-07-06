const express = require("express");

const { setTokenCookie, requireAuth, restoreUser } = require("../../utils/auth");
const { Booking, Review, Spot, User } = require('../../db/models')

const { check } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

const router = express.Router();

const validateSignup = [
  check("email")
    .exists({ checkFalsy: true })
    .isEmail()
    .withMessage("Please provide a valid email."),
  check("username")
    .exists({ checkFalsy: true })
    .isLength({ min: 4 })
    .withMessage("Please provide a username with at least 4 characters."),
  check("username").not().isEmail().withMessage("Username cannot be an email."),
  check("password")
    .exists({ checkFalsy: true })
    .isLength({ min: 6 })
    .withMessage("Password must be 6 characters or more."),
  handleValidationErrors,
];

// Sign up
router.post("/sign-up", validateSignup, async (req, res) => {
  const { firstName, lastName, email, password, username } = req.body;

  const trackEmail = await User.findOne({
    where: { email }
  })
  if (trackEmail) {
    res.status(403);
    res.json({
      message: "User with that email already exists!"
    })
  }

  const user = await User.signup({ firstName, lastName, email, username, password });
  
  if (!firstName) {
    res.status(400).json({
      message: "First Name is required"
    })
  }
  if (!lastName) {
    res.status(400).json({
      message: "Last Name is required"
    })
  }


  await setTokenCookie(res, user);

  return res.json({
    user,
  });
});

//Get the Current User
router.get("/user", requireAuth, async(req, res) => {

  return res.json(req.user);
});


module.exports = router;
