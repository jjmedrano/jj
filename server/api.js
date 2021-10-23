const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();
const serverless = require("serverless-http");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const bizSdk = require('facebook-nodejs-business-sdk');
const Content = bizSdk.Content;
const CustomData = bizSdk.CustomData;
const DeliveryCategory = bizSdk.DeliveryCategory;
const EventRequest = bizSdk.EventRequest;
const UserData = bizSdk.UserData;
const ServerEvent = bizSdk.ServerEvent;
const requestIp = require('request-ip');

const access_token = process.env.FACEBOOK_ACCESS_TOKEN;
const pixel_id = 'PIXEL_ID';
const api = bizSdk.FacebookAdsApi.init(access_token);

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(requestIp.mw())

//Email Submission Endpoint
router.post("*/submit", async (req, res) => {
  res.redirect("/reservation");
});

//Facebook Server Side Tracking Endpoint
router.post("*/server-side-tracking", async (req, res) => {

  let current_timestamp = Math.floor(new Date() / 1000);

  const userData = (new UserData())
    .setClientIpAddress(req.clientIp)
    .setClientUserAgent(req.headers['user-agent'])

  const serverEvent = (new ServerEvent())
    .setEventName(req.body.eventName)
    .setEventTime(current_timestamp)
    .setUserData(userData)
    .setEventSourceUrl(req.body.eventUrl)
    .setActionSource('website')
    .setEventId(req.body.eventId);

  const eventsData = [serverEvent];
  const eventRequest = (new EventRequest(access_token, pixel_id))
    .setEvents(eventsData);

  eventRequest.execute().then(
    response => {
      console.log('Response: ', response);
    },
    err => {
      console.error('Error: ', err);
    }
  );
});

//Stripe Payment Endpoint
app.post("/charge", async (req, res) => {
  const token = req.body.stripeToken;

  const charge = await stripe.charges.create(
    {
      amount: 1099,
      currency: "usd",
      description: "Boomer's Tutorial",
      source: token,
    },
    function (err, charge) {
      if (charge) {
        res.redirect("/thank-you");
      }
      if (err) {
        res.redirect("/reservation");
      }
    }
  );
});

app.use("/", router);

module.exports.handler = serverless(app);
