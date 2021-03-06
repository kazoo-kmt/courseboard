
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
    Course.find().populate({ path: 'instructor', select: 'fullname first last' }).exec( (error, courses) => {

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
    Course.findById(req.params.id)
          .populate('user')
          .populate('students')
          .populate('posts')
          .populate({ path: 'instructor', select: 'fullname first last' })
          .exec(function (err, course) {
            
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
        User.findById(req.userId, '+email').exec(function (err, user) {
          if (err) { return res.status(400).send(err) }

            console.log(user)

          user.courses.unshift(course);
          user.save(function(err) {
            // SEND NOTIFICATION TO STUDENT
            app.mailer.send('emails/student-enroll-notification', {
              to: user.email,
              course: course,
              subject: 'Welcome to ' + course.title,
              user: user
            }, function (err) {
              if (err) { console.log(err); return }
            });
          });

          // SEND NOTIFICATION TO INSTRUCTOR
          User.findById(course.instructor, '+email').exec(function (err, instructor) {
            console.log(instructor)
            app.mailer.send('emails/enroll-notification', {
              to: instructor.email,
              subject: 'New Student: ' + user.first + " " + user.last,
              instructor: instructor,
              course: course,
              student: user
            }, function (err) {
              if (err) { console.log(err); return }
            });
          })
        })
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

      var index = course.students.indexOf(req.userId);
    
      if (index > -1) {
        course.students.splice(index, 1);
        User.findById(req.userId).exec(function (err, user) {
          if (err) { return res.status(400).send(err) }

          user.courses.splice(user.courses.indexOf(course._id), 1);
          user.save();
        })
      }
      course.save()

      res.send(course);
    });
  });
}