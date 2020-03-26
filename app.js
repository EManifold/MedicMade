const express = require("express"),
  app = express(),
  mongoose = require("mongoose"),
  bodyParser = require("body-parser"),
  Question = require("./models/question"),
  Comment = require("./models/comment"),
  seedDB = require("./seeds"),
  passport = require("passport"),
  methodOverride = require("method-override"),
  LocalStrategy = require("passport-local"),
  User = require("./models/user");

seedDB();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Our app is running on port ${PORT}`);
});

app.use(methodOverride("_method"));

//Connecting to mongodb
mongoose
  .connect(
    "mongodb+srv://EManifold:XXXX@cluster0-lbblu.mongodb.net/medic_made?retryWrites=true&w=majority",
    { useNewUrlParser: true, useCreateIndex: true }
  )
  .then(() => {
    console.log("Connected to DB!");
  })
  .catch(err => {
    console.log("ERROR:", err.message);
  });

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

//Connecting the css files
app.use(express.static(__dirname + "/public"));

//passport configuration
app.use(
  require("express-session")({
    secret: "New secret",
    resave: false,
    saveUninitialized: false
  })
);

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next) {
  res.locals.currentUser = req.user;
  next();
});

//===============
//ROUTES
//===============

//Connecting to the home page
app.get("/", function(req, res) {
  res.render("landing");
});

//Connecting to the blog page
app.get("/blog", function(req, res) {
  res.render("blog");
});

//Connecting to the about page
app.get("/about", function(req, res) {
  res.render("about");
});

//Connecting to the pricing page
app.get("/pricing", function(req, res) {
  res.render("pricing");
});

//Creating a new question
app.get("/forum/new", function(req, res) {
  res.render("forum/new");
});

//============
//Question routes
//============

// //INDEX route - show all questions
app.get("/forum", function(req, res) {
  //Get all questions from DB
  Question.find({}, function(err, allQuestions) {
    if (err) {
      console.log(err);
    } else {
      res.render("forum/forum", { questions: allQuestions });
    }
  });
});

// CREATE route - add new question to DB
app.post("/forum", isLoggedIn, function(req, res) {
  //get data from form and add to questions array
  var issue = req.body.issue;
  var description = req.body.description;
  var author = {
    id: req.user._id,
    username: req.user.username
  };
  var newQuestion = { issue: issue, description: description, author: author };
  // Create a new question and save to db
  Question.create(newQuestion, function(err, newlyCreated) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/forum");
    }
  });
});

//SHOW route - more info about one specific question
app.get("/forum/:id", isLoggedIn, function(req, res) {
  // Find the campground with provided ID
  Question.findById(req.params.id)
    .populate("comments")
    .exec(function(err, foundQuestion) {
      if (err) {
        console.log(err);
      } else {
        res.render("forum/show", { question: foundQuestion });
      }
    });
});

//===========
//COMMENT ROUTES
//===========

//new comment route
app.get("/forum/:id/comments/new", isLoggedIn, function(req, res) {
  Question.findById(req.params.id, function(err, question) {
    if (err) {
      console.log(err);
    } else {
      res.render("comments/new", { question: question });
    }
  });
});

//where we submit the new comment form to
app.post("/forum/:id/comments", isLoggedIn, function(req, res) {
  //look up question using id
  Question.findById(req.params.id, function(err, question) {
    if (err) {
      console.log(err);
      res.redirect("/forum");
    } else {
      Comment.create(req.body.comment, function(err, comment) {
        if (err) {
          console.log(err);
        } else {
          //add username and id to comment
          comment.author.id = req.user._id;
          comment.author.username = req.user.username;
          //save comment
          comment.save();
          question.comments.push(comment);
          question.save();
          res.redirect("/forum/" + question._id);
        }
      });
    }
  });
});

//comment edit route
app.get("/forum/:id/comments/:comment_id/edit", checkCommentOwnership, function(
  req,
  res
) {
  Comment.findById(req.params.comment_id, function(err, foundComment) {
    if (err) {
      res.redirect("back");
    } else {
      res.render("comments/edit", {
        question_id: req.params.id,
        comment: foundComment
      });
    }
  });
});

//comment update route
app.put("/forum/:id/comments/:comment_id", checkCommentOwnership, function(
  req,
  res
) {
  Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(
    err,
    updatedComment
  ) {
    if (err) {
      res.redirect("back");
    } else {
      res.redirect("/forum/" + req.params.id);
    }
  });
});

//comment destroy route
app.delete("/forum/:id/comments/:comment_id", checkCommentOwnership, function(
  req,
  res
) {
  Comment.findByIdAndRemove(req.params.comment_id, function(err) {
    if (err) {
      res.redirect("back");
    } else {
      res.redirect("/forum/" + req.params.id);
    }
  });
});

//===============
//AUTH ROUTES
//===============

//get signup page
app.get("/register", function(req, res) {
  res.render("register");
});

//handle sign up logic
app.post("/register", function(req, res) {
  var newUser = new User({ username: req.body.username });
  User.register(newUser, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      return res.render("register");
    }
    passport.authenticate("local")(req, res, function() {
      res.redirect("/");
    });
  });
});

app.get("/login", function(req, res) {
  res.render("login");
});

//handling login logic
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/forum",
    failureRedirect: "/login"
  }),
  function(req, res) {
    res.send("login logic happens here");
  }
);

//add logout route
app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/login");
  }
}

//MIDDLEWARE

function checkCommentOwnership(req, res, next) {
  if (req.isAuthenticated()) {
    Comment.findById(req.params.comment_id, function(err, foundComment) {
      if (err) {
        res.redirect("back");
      } else {
        if (foundComment.author.id.equals(req.user._id)) {
          next();
        } else {
          res.redirect("back");
        }
      }
    });
  }
}
