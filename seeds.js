var mongoose = require('mongoose');
var Question = require('./models/question');
var Comment = require('./models/comment');

var data = [
	{issue: 'new title', description: 'lskjdglks glsjd lgkjsd gls jgj dglsjd'},
	{issue: 'new title 2', description: 'lskjdglks glsjd lgkjsd gls jgj dglsjd'},
	{issue: 'new title 3', description: 'lskjdglks glsjd lgkjsd gls jgj dglsjd'}
]

// remove all questions
function seedDB() {
// 	Question.remove({}, function(err) {
// 	if(err) {
// 		console.log(err)
// 	}
// 	console.log('Removed questions')
// 		data.forEach(function(seed) {
// 		Question.create(seed, function(err, question) {
// 			if(err) {
// 				console.log(err)
// 			} else {
// 				console.log('added question')
// 				Comment.create({text: 'This is a new comment', author: 'Homer'}, function(err, comment) {
// 					if(err) {
// 						console.log(err)
// 					} else {
// 						question.comments.push(comment);
// 						question.save();
// 						console.log('created new comment')
// 					}
// 				})
// 			}
// 		})
// 	})
// });
	
}

module.exports = seedDB;