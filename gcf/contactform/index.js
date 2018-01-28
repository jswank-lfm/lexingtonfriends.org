const config = require('./config.json');
const request = require('request');
const sendgrid = require('@sendgrid/mail');


/**
 * HTTP Cloud Function.
 *
 * @param {Object} req Cloud Function request context.
 *                     http://expressjs.com/en/4x/api.html#req 
 * @param {Object} res Cloud Function response context.
 *                     http://expressjs.com/en/4x/api.html#res 
 */
exports.contactform = function contactform (req, res) {

  res.header('Access-Control-Allow-Origin', config.ORIGIN);

  request.post(
    "https://www.google.com/recaptcha/api/siteverify",
    { form: {
      "secret": config.RECAPTCHA_KEY,
      "remoteip": req.ip,
      "response": req.body['g-recaptcha-response']
      }
    },
    function(err,r,body) {
      var verify = JSON.parse(body);
      if (!err && verify.success) {
        sendEmail(req,res);
      } else {
        console.error(err);
        console.error(verify['error-codes']);
        res.send(400,"Unable to validate reCAPTCHA");
      }
    }
  );

};

function sendEmail(req,res) {

  sendgrid.setApiKey(config.SENDGRID_API_KEY);

  console.log("contact intiated from " + req.body.email);

  var msg = {
    to: config.MAIL_TO,
    from: config.MAIL_FROM,
    subject: config.MAIL_SUBJECT_PREFIX + req.body.subject,
    replyTo: {
      name: req.body.name,
      email: req.body.email
    }
  };

  msg.text = "Name: " + req.body.name + "\n" + "Phone: " + req.body.phone + "\n\n" + req.body.message;

  sendgrid.send(msg, function(err,result) {
    if (err) {
      console.error("received sendgrid error: " + err);
      console.error(result);
      res.send(500,"system error sending email");
    } else {
      res.send(200,"email sent");
    }
  });
}

