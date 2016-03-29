var User = require('../models/user.js')
  , Course = require('../models/course.js')
  , Tag = require('../models/tag.js')
  , auth = require('./auth.js')
  , request = require('request')
  , config = require('../config.js')
  , _ = require('lodash')


module.exports = function(app) {
  // INDEX
  app.get('/api/courses', function (req, res) {
    Course.find().exec( (error, courses) => {

      res.send(courses);
    });
  });

  // CREATE
  app.post('/api/courses', auth.ensureAuthenticated, function (req, res) {
    var course = new Course(req.body);
    course.user = req.userId
    course.save(function(err, course) {
      if (err) { return res.status(400).send(err) }

      res.send(course);
    });

  });

  // SHOW
  app.get('/api/courses/:id', function (req, res) {
    Course.findById(req.params.id).populate('user').populate('students').populate('posts').exec(function (err, course) {
      if (err) { return res.status(400).send(err) }

      res.send(course);
    });
  });

  // UPDATE
  app.put('/api/courses/:id', auth.ensureAuthenticated, function (req, res) {
    console.log(req.body)
    Course.findByIdAndUpdate(req.body._id, req.body, function (err, course) {
      if (!course) { return res.status(400).send({message: 'Course not found' }) }

      res.status(200).send(course);
    });
  });

  // DELETE
  app.delete('/api/courses/:id', auth.ensureAuthenticated, function (req, res) {
    Course.findById(req.params.id).exec(function (err, course) {
      if (err) { return res.status(400).send(err) }

      courseId = course._id;
      course.remove();

      res.send("Successfully removed course: " + courseId);
    })
  });

  // ENROLL
  app.put('/api/courses/:id/enroll', auth.ensureAuthenticated, function (req, res) {
    Course.findById(req.params.id, function (err, course) {
      if (!course) { return res.status(400).send({message: 'Course not found' }) }

      if (!(course.students.indexOf(req.userId) > -1)) {
        course.students.push(req.userId);
      }
      else { return res.status(400).send({message: 'Already enrolled!'})}
      course.save()

      res.send(course);
    });
  });

  // UNENROLL
  app.put('/api/courses/:id/unenroll', auth.ensureAuthenticated, function (req, res) {
    Course.findById(req.params.id, function (err, course) {
      if (!course) { return res.status(400).send({message: 'Course not found' }) }

      index = course.students.indexOf(req.userId)
      if (index > -1) {
        course.students.splice(index, 1);
      }
      course.save()

      res.send(course);
    });
  });
}
