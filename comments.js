// Create web server

// Import modules
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('./cors');
const authenticate = require('../authenticate');
const Comments = require('../models/comments');

// Create router
const commentRouter = express.Router();

// Use body parser to parse request body
commentRouter.use(bodyParser.json());

// Route for comments
commentRouter.route('/')
    // Pre-flight request
    .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
    // GET request
    .get(cors.cors, (req, res, next) => {
        Comments.find(req.query)
            .populate('author')
            .then(comments => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(comments);
            }, err => next(err))
            .catch(err => next(err));
    })
    // POST request
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        if (req.body != null) {
            req.body.author = req.user._id;
            Comments.create(req.body)
                .then(comment => {
                    Comments.findById(comment._id)
                        .populate('author')
                        .then(comment => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(comment);
                        });
                }, err => next(err))
                .catch(err => next(err));
        } else {
            err = new Error('Comment not found in request body');
            err.status = 404;
            return next(err);
        }
    })
    // PUT request
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /comments');
    })
    // DELETE request
    .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        Comments.deleteMany({})
            .then(response => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(response);
            }, err => next(err))
            .catch(err => next(err));
    });

// Route for comment by id
commentRouter.route('/:commentId')
    // Pre-flight request
    .options(cors.corsWithOptions, (req, res) => { res.sendStatus(
