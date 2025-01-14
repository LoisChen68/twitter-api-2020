const { Tweet, User, Reply, Like, sequelize } = require('../models')
const helpers = require('../_helpers')

const tweetController = {
  postTweet: (req, res, next) => {
    const { description } = req.body
    const UserId = helpers.getUser(req)?.id
    const [descriptionMin, descriptionMax] = [1, 140]
    if (description.length < descriptionMin || description.length > descriptionMax) throw new Error(`字數限制需在 ${descriptionMin} ~ ${descriptionMax} 之內`)

    User.findByPk(UserId) // 查看user是否存在
      .then(user => {
        if (!user) throw new Error('使用者不存在')
        return Tweet.create({
          description,
          UserId
        })
      })
      .then(tweet => {
        res.json(tweet)
      })
      .catch(err => next(err))
  },
  getTweets: (req, res, next) => {
    const currentUserId = helpers.getUser(req)?.id
    Promise.all([
      Tweet.findAll({
        raw: true,
        nest: true,
        include: [
          { model: User, attributes: ['id', 'account', 'name', 'profilePhoto'] }
        ],
        attributes: {
          include:
          [[sequelize.literal('( SELECT COUNT(*) FROM Replies AS repliesCount  WHERE Tweet_id = Tweet.id)'), 'replyCounts'], [sequelize.literal('( SELECT COUNT(*) FROM Likes AS likedCount  WHERE Tweet_id = Tweet.id)'), 'likeCounts']
          ]
        },
        order: [['createdAt', 'DESC']]
      }),
      Like.findAll({})
    ])
      .then(([tweets, likes]) => {
        console.log(tweets)
        const result = tweets.map(tweet => ({
          ...tweet,
          isLiked: likes.some(like => like.TweetId === tweet.id && currentUserId === like.UserId)
        }))
        res.json(result)
      })
      .catch(err => next(err))
  },
  getTweet: (req, res, next) => {
    const currentUserId = helpers.getUser(req)?.id
    const TweetId = req.params.tweet_id
    Promise.all([
      Tweet.findByPk(TweetId, {
        raw: true,
        nest: true,
        include: [
          { model: User, attributes: ['id', 'account', 'name', 'profilePhoto'] }
        ],
        attributes: {
          include:
          [[sequelize.literal('( SELECT COUNT(*) FROM Replies AS repliesCount  WHERE Tweet_id = Tweet.id)'), 'replyCounts'], [sequelize.literal('( SELECT COUNT(*) FROM Likes AS likedCount  WHERE Tweet_id = Tweet.id)'), 'likeCounts']
          ]
        }
      }),
      Like.findAll({ where: { TweetId }, raw: true })
    ])
      .then(([tweet, likes]) => {
        if (!tweet) throw new Error('推文不存在')
        tweet.isLiked = likes.some(like => like.TweetId === tweet.id && like.UserId === currentUserId)
        res.json(tweet)
      })
      .catch(err => next(err))
  },
  likeTweet: (req, res, next) => {
    const TweetId = Number(req.params.id)
    const UserId = helpers.getUser(req)?.id
    return Promise.all([
      Tweet.findByPk(TweetId, { raw: true }),
      Like.findOne({
        where: { UserId, TweetId }
      })
    ])
      .then(([tweet, like]) => {
        if (!tweet) throw new Error('推文不存在')
        if (like) throw new Error('按過喜歡了')
        return Like.create({
          UserId,
          TweetId
        })
      })
      .then(like => {
        res.json(like)
      })
      .catch(err => next(err))
  },
  unlikeTweet: (req, res, next) => {
    const TweetId = Number(req.params.id)
    const UserId = helpers.getUser(req)?.id
    return Promise.all([
      Tweet.findByPk(TweetId, { raw: true }),
      Like.findOne({
        attributes: ['id', 'UserId', 'TweetId', 'createdAt', 'updatedAt'],
        where: { UserId, TweetId }
      })
    ])
      .then(([tweet, like]) => {
        if (!tweet) throw new Error('推文不存在')
        if (!like) throw new Error('沒按過')
        return like.destroy()
      })
      .then(like => {
        res.json(like)
      })
      .catch(err => next(err))
  },
  postReply: (req, res, next) => {
    const TweetId = Number(req.params.tweet_id)
    const { comment } = req.body
    const UserId = helpers.getUser(req)?.id
    Tweet.findByPk(TweetId)
      .then(tweet => {
        if (!tweet) throw new Error('推文不存在')
        return Reply.create({
          comment,
          UserId,
          TweetId
        })
      })
      .then(reply => {
        res.json(reply)
      })
      .catch(err => next(err))
  },
  getReplies: (req, res, next) => {
    const TweetId = Number(req.params.tweet_id)
    Promise.all([
      Tweet.findByPk(TweetId),
      Reply.findAll({
        where: { TweetId },
        include: [
          { model: User, attributes: ['id', 'account', 'name', 'profilePhoto'] },
          { model: Tweet, attributes: { exclude: ['id', 'description', 'createdAt', 'updatedAt'] }, include: { model: User, attributes: ['id', 'account'] } }
        ],
        order: [['createdAt', 'DESC']]
      })
    ])
      .then(([tweet, replies]) => {
        if (!tweet) throw new Error('推文不存在')
        res.json(replies)
      })
      .catch(err => next(err))
  }
}

module.exports = tweetController
