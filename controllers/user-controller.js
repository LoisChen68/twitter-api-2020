const bcrypt = require('bcryptjs')
const { Op } = require('sequelize')
const { User } = require('../models')
const userController = {
  signUp: (req, res, next) => {
    const { password, passwordCheck, email, account, name } = req.body
    if (password !== passwordCheck) throw new Error('密碼與確認密碼不相符')
    User.findOne({
      attributes: ['email', 'account'],
      where: {
        [Op.or]: [{ email }, { account }]
      }
    })
      .then(user => {
        if (!user) return bcrypt.hash(password, 10)
        if (user.email === email) throw new Error('該Email已被註冊！')
        if (user.account === account) throw new Error('該account已被註冊！')
      })
      .then(hash => User.create({
        name,
        account,
        email,
        password: hash,
        profilePhoto: 'https://cdn-icons-png.flaticon.com/512/1144/1144760.png',
        coverPhoto: 'https://i.imgur.com/t0YRqQH.jpg'
      }))
      .then(newUser => res.json({ status: 'success', data: newUser }))
      .catch(err => next(err))
  }
}

module.exports = userController
