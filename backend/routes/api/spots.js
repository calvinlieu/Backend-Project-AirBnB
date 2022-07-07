const express = require('express');
const sequelize = require('sequelize')
const { setTokenCookie, restoreUser, requireAuth } = require('../../utils/auth');
const { Booking, Review, Image, Spot, User } = require('../../db/models');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');
const user = require('../../db/models/user');

const router = express.Router();


//checks to see if the spot is a valid spot
const spotValidator = (req, res, next) => {
    const {address, city, state, country, lat, lng, name, description, price } = req.body;
    let results = { errors: {} }

    if (!address) results.errors.address = "Street address is required"
    if (!city) results.errors.city = "City is required"
    if (!state) results.errors.state = "State is required"
    if (!country) results.errors.country = "Country is required"
    if (!lat) results.errors.lat = "Latitude is not valid"
    if (!lng) results.errors.lng = "Longitutde is not valid"
    if (name.length >= 50) results.errors.name = "Name must be less than 50 characters"
    if (!description) results.errors.description = "Description is required"
    if (!price) results.errors.price = "Price per day is required"
    
    if (results.errors.length) {
        const error = new Error("Validation Error");
        error.status = 400;
        error.errors = results.errors;
        return next(error)
    } else {
        return next();
    }

}

//get all spots
router.get('/', async (req, res) => {
    let spots = await Spot.findAll();
    

    return res.json(spots);
});

//get all spots owned by the current user
router.get('/your-spots', requireAuth, async (req, res) => {
    const allSpots = await Spot.findAll({
        where: { ownerId: req.user.id }
    })

    res.json(allSpots);
})

//get details of a Spot from an id
router.get('/:id', async(req, res) => {
    const spots = await Spot.findByPk(req.params.id, {
        include: [
            {
                model: Image,
                as: 'images',
                attributes: ['url']
            },
            {
                model: User,
                as: 'Owner',
                attributes: ['id', 'firstName', 'lastName']
            }]
    });

    const reviewData = await Spot.findByPk(req.params.id, {
        include: {
            model: Review,
            attributes: []
        },
        attributes: [
            [sequelize.fn('COUNT', sequelize.col('*')), 'numReviews'],
            [sequelize.fn('AVG', sequelize.col('stars')), 'avgStarRating']
        ],
        raw: true
    })

    if (!spots) {
        res.status(404);
        res.json({
            message: "Spot couldn't be found",
            statusCode: 404
        })
    }
    const spotData = spots.toJSON();
    spotData.numReviews = reviewData.numReviews;
    spotData.avgStarRating = reviewData.avgStarRating;

    res.json(spotData);

})

//create a spot
router.post('/', [spotValidator, requireAuth], async(req, res) => {
    const { address, city, state, country, lat, lng, name, description, price, } = req.body;

    const spot = await Spot.create({
        address,
        city,
        state,
        country,
        lat,
        lng,
        name,
        description,
        price,
        ownerId: req.params.id
    })

    res.json(spot);
})

//edit a spot
router.put('/:spotId', [requireAuth, spotValidator], async(req, res) => {
    const { address, city, state, country, lat, lng, name, description, price } = req.body;
    const spotId = req.params.spotId;

    const spot = Spot.findByPk(spotId);

    if (spot.ownerId !== req.user.id) {
        res.status(401);
        return res.json({
            message: "Unauthorized"
        })
    }

    spot.address = address;
    spot.city = city;
    spot.state = state;
    spot.country = country;
    spot.lat = lat;
    spot.lng = lng;
    spot.name = name;
    spot.description = description;
    spot.price = price;

    await spot.save();
    res.json(spot);

})

//delete a spot
router.delete('/:spotId', requireAuth, async (req, res) => {
    const { spotId } = req.params;
    const currentSpot = await Spot.findByPk(spotId);


    if(!currentSpot) {
        res.status(404);
       res.json({
        message: "Spot couldn't be found",
        statusCode: 404
      })
    }
    
    currentSpot.destroy()
    res.json({
       message: "Successfully deleted",
     })
})





module.exports = router;