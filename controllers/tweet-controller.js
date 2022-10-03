const { Tweet, User } = require('../models')

const tweetController = {
  postTweet: (req, res, next) => {
    const { description } = req.body
    const userId = req.user.id
    if (!description) throw new Error('文章必須有內容')

    User.findByPk(userId) // 查看user是否存在
      .then(user => {
        if (!user) throw new Error('使用者不存在')
        return Tweet.create({
          description,
          UserId: userId
        })
      })
      .then(tweet => {
        res.json({ status: 'success', data: { tweet } })
      })
      .catch(err => next(err))
  },
  getTweets: (req, res, next) => {
    Tweet.findAll({})
      .then(tweets => {
        res.json({ status: 'success', data: { tweets } })
      })
      .catch(err => next(err))
  },
  getTweet: (req, res, next) => {
    const tweetId = req.params.tweet_id
    Tweet.findByPk(tweetId)
      .then(tweet => {
        if (!tweet) throw new Error('此推文不存在')
        res.json({ status: 'success', data: { tweet } })
      })
      .catch(err => next(err))
  }
}

module.exports = tweetController