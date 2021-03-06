const _ = require('lodash');
const Path = require('path-parser');
const { URL } = require('url'); //parse urls for webhook part of back from send grid
const mongoose = require('mongoose');
const requireLogin = require('../middlewares/requireLogin');
const requireCredits = require('../middlewares/requireCredits');
//remember cause of testing we use this import method.
const Survey = mongoose.model('surveys');
const Mailer = require('../services/Mailer');
const surveyTemplate = require('../services/emailTemplates/surveyTemplate');

module.exports = app => {
  app.get('/api/surveys', requireLogin, async (req,res) => {
    const surveys = await Survey.find({ _user: req.user.id })
      .select({ recipients: false });
    res.send(surveys);
  });
  app.get('/api/surveys/:surveyId/:choice',(req,res)=>{
    res.send('thanks for voting!');
  });
  //create survey and send out big email out
  app.post('/api/surveys', requireLogin, requireCredits, async (req,res)=>{
    const { title, subject, body, recipients } = req.body;
    //1 > define what email have
    const survey = new Survey({
      title, 
      body, 
      subject, 
      recipients: recipients.split(',').map(email => ({ email: email.trim() })),
      _user: req.user.id, //id by mongoose generated.
      dateSent: Date.now()
    });
    //2 > define email template 

    // 1 + 2 > generate mailer(services) object >> this.toJSON()
    // send mailer to api provider for email
    //Great place to send email
    const mailer = new Mailer(survey, surveyTemplate(survey));
    //after creation Mailer.js
    try { //try catch is error handler for multi await
      await mailer.send();
      await survey.save();
      req.user.credits -= 1;
      const user = await req.user.save();
      res.send(user);
    } catch (err) {
      res.status(422).send(err);
    }

  });
  //webhook talk 2 server because of event happen by our client
  //webhook when some outer api do some process and give our app some type of info and notice
  // some callback that event happened. api/surveys/webhooks
  app.post('/api/surveys/webhooks',(req, res)=>{
    const p = new Path('/api/surveys/:surveyId/:choice');
    _.chian(req.body)
      .map(({email, url})=>{ //event obj come from sendgrid
        //extract route from whole url //ret id and choice
        const match = p.test(new URL(url).pathname); 
        if(match) { 
          return { email, surveyId: match.surveyId, choice: match.choice };
        }
      })
      .compact() //compact from  _ remove undefined
      .uniqBy('email', 'surveyId')
      .each(({surveyId, email, choice})=>{ //event
        Survey.updateOne({
          _id: surveyId,
          recipients: {
            $elemMatch: { email, responded: false}
          }
        },{
          $inc: { [choice]: 1},
          $set: { 'recipients.$.responded': true},
          lastResponded: new Date()
        }).exec();
      })
      .value(); //value pull out refined arr
    res.send({});
  });
};













// app.post('/api/surveys/webhooks',(req, res)=>{
//   const p = new Path('/api/surveys/:surveyId/:choice');
//   const events = _.map(req.body, ({email, url})=>{ //event obj come from sendgrid
//     //extract route from whole url //ret id and choice
//     const match = p.test(new URL(url).pathname); 
//     if(match) { 
//       return { email, surveyId: match.surveyId, choice: match.choice };
//     }
//   });
//   //compact from  _ remove undefined
//   const compactEvents = _.compact(events);
//   const uniqueEvents = _.uniqBy(compactEvents, 'email', 'surveyId');
//   res.send({});
// });
